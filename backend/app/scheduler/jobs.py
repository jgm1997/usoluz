from datetime import date, timedelta
import logging

from app.core.database import AsyncSessionLocal
from app.services import price_service
from app.services.alert_service import evaluate_alerts

logger = logging.getLogger(__name__)

PROVIDERS = ["ree_pvpc", "ree_spot"]


async def fetch_today_prices():
    today = date.today()
    logger.debug(f"⏰ Scheduler: updating {today}'s prices")

    async with AsyncSessionLocal() as db:
        for provider in PROVIDERS:
            try:
                prices = await price_service.get_prices_by_date(
                    db, today, provider, force_refresh=True
                )
                logger.debug(f"✅ {provider}: Updated {len(prices)} prices")

                current = await price_service.get_current_price(db, provider)
                if current:
                    await evaluate_alerts(db, current["value_kwh"], provider)
            except Exception as e:
                logger.error(f"❌ Failed updating {provider}: {e}")


async def fetch_tomorrow_prices():
    tomorrow = date.today() + timedelta(days=1)
    logger.debug(f"⏰ Scheduler: updating {tomorrow}'s prices")

    async with AsyncSessionLocal() as db:
        for provider in PROVIDERS:
            try:
                prices = await price_service.get_prices_by_date(
                    db, tomorrow, provider, force_refresh=True
                )
                logger.debug(f"✅ {provider}: Updated {len(prices)} prices")
            except Exception as e:
                logger.error(f"❌ Failed updating {provider}: {e}")


async def warmup():
    logger.debug("🔥 Warmup: checking today's prices...")

    async with AsyncSessionLocal() as db:
        for provider in PROVIDERS:
            try:
                prices = await price_service.get_prices_by_date(
                    db, date.today(), provider
                )
                if prices:
                    logger.debug(
                        f"✅ Warmup {provider}: {len(prices)} prices already in DB"
                    )
                else:
                    logger.debug(f"⬇️ Warmup {provider}: downloading...")
                    await price_service.get_prices_by_date(
                        db, date.today(), provider, force_refresh=True
                    )
            except Exception as e:
                logger.error(f"❌ Warmup error {provider}: {e}")
