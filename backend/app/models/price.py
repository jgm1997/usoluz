from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String
from sqlalchemy.sql import func

from app.core.database import Base


class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    datetime_utc = Column(DateTime(timezone=False), nullable=False)
    value_mwh = Column(Numeric(10, 4), nullable=False)
    value_kwh = Column(Numeric(10, 6), nullable=False)
    provider = Column(String(50), nullable=False, default="esios_pvpc")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_prices_datetime_provider", "datetime_utc", "provider", unique=True),
        Index("idx_prices_datetime_utc", "datetime_utc"),
    )

    def __repr__(self):
        return f"<Price {self.datetime_utc} -> {self.value_kwh} €/kWh>"
