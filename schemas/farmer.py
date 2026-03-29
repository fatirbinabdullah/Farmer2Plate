# schemas/farmer.py

from pydantic import BaseModel
from typing import Optional

class FarmerRegister(BaseModel):
    name: str
    phone: str
    password: str
    farm_name: str
    farm_address: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None


class FarmerLogin(BaseModel):
    phone: str
    password: str


class FarmerResponse(BaseModel):
    id: int
    name: str
    phone: str
    farm_name: Optional[str] = None
    farm_address: Optional[str] = None

    class Config:
        from_attributes = True


class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    farm_name: Optional[str] = None
    farm_address: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None