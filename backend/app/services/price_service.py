from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo
from decimal import Decimal
import logging
from typing import Any

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.price import Price
from app.core.redis import cache_get, cache_set
from app.services.ree import ree_client

logger = logging.getLogger(__name__)

TTL_CURRENT_HOUR = 60 * 5
TTL_TODAY = 60 * 30
TTL_PAST_DAY = 60 * 60 * 24


def _cache_key(target_date: date, provider: str) -> str:
    return f"prices:{provider}:{target_date.isoformat()}"


def _choose_ttl(target_date: date) -> int:
    today = date.today()
    if target_date < today:
        return TTL_PAST_DAY
    return TTL_TODAY


def _model_to_dict(price: Price) -> dict[str, Any]:
    return {
        "datetime_utc": price.datetime_utc.isoformat(),
        "value_mwh": float(price.value_mwh),
        "value_kwh": float(price.value_kwh),
        "provider": price.provider,
    }


async def _fetch_from_db(
    db: AsyncSession, target_date: date, provider: str
) -> list[dict[str, Any]]:
    start = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
    end = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

    result = await db.execute(
        select(Price)
        .where(
            and_(
                Price.datetime_utc >= start,
                Price.datetime_utc <= end,
                Price.provider == provider,
            )
        )
        .order_by(Price.datetime_utc)
    )
    rows = result.scalars().all()
    return [_model_to_dict(r) for r in rows]


async def _save_to_db(db: AsyncSession, prices: list[dict[str, Any]]):
    for item in prices:
        dt = datetime.fromisoformat(
            item["datetime_utc"].replace("Z", "+00:00")
        ).replace(tzinfo=None)
        price = Price(
            datetime_utc=dt,
            value_mwh=Decimal(str(item["value_mwh"])),
            value_kwh=Decimal(str(item["value_kwh"])),
            provider=item["provider"],
        )
        await db.merge(price)

    await db.commit()
    logger.info(f"Saved {len(prices)} price records to the database")


async def get_prices_by_date(
    db: AsyncSession, target_date: date, provider: str, force_refresh: bool = False
) -> list[dict[str, Any]]:
    cache_key = _cache_key(target_date, provider)
    if not force_refresh:
        cached = await cache_get(cache_key)
        if cached:
            logger.debug(f"Cache HIT for {cache_key}")
            return cached

        db_prices = await _fetch_from_db(db, target_date, provider)
        if db_prices:
            logger.debug(f"DB HIT for {cache_key}")
            await cache_set(cache_key, db_prices, _choose_ttl(target_date))
            return db_prices

    logger.info(f"Fetching from REE for {target_date} / {provider}")
    if provider == "ree_pvpc":
        api_prices = await ree_client.get_pvpc_prices(target_date)
    elif provider == "ree_spot":
        api_prices = await ree_client.get_spot_prices(target_date)
    else:
        logger.error(f"Unknown provider: {provider}")
        return []

    if not api_prices:
        return []

    await _save_to_db(db, api_prices)
    await cache_set(cache_key, api_prices, _choose_ttl(target_date))
    return api_prices


async def get_current_price(db: AsyncSession, provider: str) -> dict[str, Any] | None:
    cache_key = f"prices:current:{provider}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    madrid_tz = ZoneInfo("Europe/Madrid")
    now = datetime.now(madrid_tz)
    today = now.date()
    prices = await get_prices_by_date(db, today, provider)
    if not prices:
        return None

    now_hour = now.hour
    current = next(
        (p for p in prices if datetime.fromisoformat(p["datetime_utc"]).hour == now_hour),
        None,
    )
    if current:
        await cache_set(cache_key, current, TTL_CURRENT_HOUR)
    return current


def classify_price(value_kwh: float) -> str:
    if value_kwh < 0.10:
        return "cheap"
    elif value_kwh < 0.18:
        return "normal"
    else:
        return "expensive"
