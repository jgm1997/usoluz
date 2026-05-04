from typing import Literal

from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    device_token: str
    platform: Literal["ios", "android"]
    alert_type: Literal["above", "below"]
    threshold_kwh: float = Field(gt=0, lt=10)
    provider: str = "ree_pvpc"


class AlertResponse(BaseModel):
    id: int
    device_token: str
    platform: str
    alert_type: str
    threshold_kwh: float
    provider: str
    is_active: bool

    class Config:
        from_attributes = True


class DeviceRegister(BaseModel):
    token: str
    platform: Literal["ios", "android"]
    timezone: str = "Europe/Madrid"


class DeviceResponse(BaseModel):
    id: int
    token: str
    platform: str
    timezone: str
    is_active: bool

    class Config:
        from_attributes = True
