from decimal import Decimal
from datetime import datetime, timedelta, timezone
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.alert import AlertCreate, DeviceRegister
from app.models.device import Device
from app.models.alert import Alert
from app.services.notification import send_price_alert

logger = logging.getLogger(__name__)

MIN_TRIGGER_INTERVAL_HOURS = 1


async def register_device(db: AsyncSession, data: DeviceRegister):
    result = await db.execute(select(Device).where(Device.token == data.token))
    device = result.scalar_one_or_none()

    if device:
        device.platform = data.platform
        device.timezone = data.timezone
        device.is_active = True
    else:
        device = Device(
            token=data.token, platform=data.platform, timezone=data.timezone
        )
        db.add(device)

    await db.commit()
    await db.refresh(device)
    return device


async def create_alert(db: AsyncSession, data: AlertCreate) -> Alert:
    alert = Alert(
        device_token=data.device_token,
        platform=data.platform,
        alert_type=data.alert_type,
        threshold_kwh=Decimal(str(data.threshold_kwh)),
        provider=data.provider,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def delete_alert(db: AsyncSession, alert_id: int) -> bool:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return False

    alert.is_active = False
    await db.commit()
    return True


async def evaluate_alerts(
    db: AsyncSession, current_kwh: float, provider: str = "ree_pvpc"
):
    result = await db.execute(
        select(Alert).where(Alert.is_active == True, Alert.provider == provider)
    )
    alerts = result.scalars().all()
    if not alerts:
        return

    logger.info(f"Evaluating {len(alerts)} active alerts with price {current_kwh}")
    now = datetime.now(timezone.utc)

    for alert in alerts:
        if alert.last_triggered_at:
            elapsed = now - alert.last_triggered_at
            if elapsed < timedelta(hours=MIN_TRIGGER_INTERVAL_HOURS):
                continue

        threshold = float(alert.threshold_kwh)
        should_trigger = (
            alert.alert_type == "below"
            and current_kwh < threshold
            or alert.alert_type == "above"
            and current_kwh > threshold
        )
        if should_trigger:
            sent = await send_price_alert(
                device_token=alert.device_token,
                alert_type=alert.alert_type,
                threshold_kwh=threshold,
                current_kwh=current_kwh,
            )
            if sent:
                alert.last_triggered_at = now
                await db.commit()
