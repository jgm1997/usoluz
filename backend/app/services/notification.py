import logging
from firebase_admin import credentials, messaging
import firebase_admin

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_firebase_app = None


def get_firebase_app():
    global _firebase_app
    if _firebase_app is None:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


async def send_price_alert(
    device_token: str, alert_type: str, threshold_kwh: float, current_kwh: float
) -> bool:
    try:
        get_firebase_app()

        if alert_type == "below":
            title = "💚 Price is low"
            body = f"the price has dropped below {current_kwh:.4f} €/kWh, which is below your threshold of {threshold_kwh:.4f} €/kWh."
        else:
            title = "🔴 Price is high"
            body = f"the price has risen above {current_kwh:.4f} €/kWh, which is above your threshold of {threshold_kwh:.4f} €/kWh."

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={
                "alert_type": alert_type,
                "threshold_kwh": f"{threshold_kwh:.4f}",
                "current_kwh": f"{current_kwh:.4f}",
            },
            token=-device_token,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="price_alerts", priority="high"
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound="default", badge=1)
                )
            ),
        )

        messaging.send(message)
        logger.info(f"✅ Notification sent to {device_token[:20]}...")
        return True

    except Exception as e:
        logger.error(f"❌ Error sending notification: {e}")
        return False
