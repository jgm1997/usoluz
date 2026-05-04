from pydantic import BaseModel


class PriceItem(BaseModel):
    datetime_utc: str
    value_mwh: float
    value_kwh: float
    provider: str
    classification: str


class CurrentPrice(BaseModel):
    datetime_utc: str
    value_kwh: float
    provider: str
    classification: str


class DayPrices(BaseModel):
    date: str
    provider: str
    prices: list[PriceItem]
    cheapest_hour: PriceItem
    most_expensive_hour: PriceItem
