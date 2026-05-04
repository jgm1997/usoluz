from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.price import CurrentPrice, DayPrices, PriceItem
from app.core.database import get_db
from app.services import price_service

router = APIRouter(prefix="/prices", tags=["prices"])

VALID_PROVIDERS = {"ree_pvpc", "ree_spot"}


@router.get("/current", response_model=CurrentPrice)
async def get_current_price(
    provider: Annotated[str, Query(enum=list(VALID_PROVIDERS))] = "ree_pvpc",
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    price = await price_service.get_current_price(db, provider)
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No data available"
        )

    return CurrentPrice(
        datetime_utc=price["datetime_utc"],
        value_kwh=price["value_kwh"],
        provider=price["provider"],
        classification=price_service.classify_price(price["value_kwh"]),
    )


@router.get("/today", response_model=DayPrices)
async def get_today_prices(
    provider: Annotated[str, Query(enum=list(VALID_PROVIDERS))] = "ree_pvpc",
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    today = date.today()
    prices = await price_service.get_prices_by_date(db, today, provider)
    if not prices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No data available"
        )

    items = [
        PriceItem(**p, classification=price_service.classify_price(p["value_kwh"]))
        for p in prices
    ]
    return DayPrices(
        date=today.isoformat(),
        provider=provider,
        prices=items,
        cheapest_hour=min(items, key=lambda x: x.value_kwh),
        most_expensive_hour=max(items, key=lambda x: x.value_kwh),
    )


@router.get("/{target_date}", response_model=DayPrices)
async def get_prices_by_date(
    target_date: date,
    provider: Annotated[str, Query(enum=list(VALID_PROVIDERS))] = "ree_pvpc",
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    prices = await price_service.get_prices_by_date(db, target_date, provider)
    if not prices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No data available"
        )

    items = [
        PriceItem(**p, classification=price_service.classify_price(p["value_kwh"]))
        for p in prices
    ]
    return DayPrices(
        date=target_date.isoformat(),
        provider=provider,
        prices=items,
        cheapest_hour=min(items, key=lambda x: x.value_kwh),
        most_expensive_hour=max(items, key=lambda x: x.value_kwh),
    )
