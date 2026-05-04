from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, status, HTTPException

from app.core.database import get_db
from app.schemas.alert import (
    AlertCreate,
    AlertResponse,
    DeviceRegister,
    DeviceResponse,
)
from app.services import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/devices", response_model=DeviceResponse)
async def register_device(
    data: DeviceRegister, db: Annotated[AsyncSession, Depends(get_db)]
):
    device = await alert_service.register_device(db, data)
    return device


@router.post("", response_model=AlertResponse)
async def create_alert(data: AlertCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    alert = await alert_service.create_alert(db, data)
    return alert


@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    deleted = await alert_service.delete_alert(db, alert_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )
    return {"ok": True}
