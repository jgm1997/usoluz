from sqlalchemy import Column, Integer, Numeric, String, Boolean, DateTime

from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    device_token = Column(String(255), nullable=False)
    platform = Column(String(10), nullable=False)  # 'ios' or 'android'
    alert_type = Column(String(10), nullable=False)
    threshold_kwh = Column(Numeric(10, 6), nullable=False)
    provider = Column(String(50), nullable=False, default="ree_pvpc")
    is_active = Column(Boolean, nullable=False, default=True)
    last_triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False)

    def __repr__(self):
        return f"<Alert {self.alert_type} {self.threshold_kwh} €/kWh>"
