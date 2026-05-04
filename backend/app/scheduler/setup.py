import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.scheduler.jobs import fetch_today_prices, fetch_tomorrow_prices

logger = logging.getLogger(__name__)


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Europe/Madrid")

    scheduler.add_job(
        fetch_today_prices,
        trigger=CronTrigger(minute=0),
        id="fetch_today_prices",
        name="Update today's prices",
        replace_existing=True,
        misfire_grace_time=300
    )

    scheduler.add_job(
        fetch_tomorrow_prices,
        trigger=CronTrigger(hour=20, minute=30),
        id="fetch_tomorrow_prices",
        name="Preload tomorrow's prices",
        replace_existing=True,
        misfire_grace_time=300
    )

    logger.info("📅 Scheduler configured")
    return scheduler
