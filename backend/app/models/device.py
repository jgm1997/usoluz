import datetime

from app.core.database import Base
from sqlalchemy.sql import func
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), nullable=False, unique=True)
    platform = Column(String(10), nullable=False)  # 'ios' or 'android
    timezone = Column(String(50), nullable=False, default="Europe/Madrid")
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        default=datetime.datetime.now(datetime.timezone.utc),
    )
    updated_at = Column(
        DateTime, nullable=True, onupdate=datetime.datetime.now(datetime.timezone.utc)
    )

    def __repr__(self):
        return f"<Device {self.platform} {self.token[:20]}...>"
