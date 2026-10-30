from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    badge: Optional[str] = None
    icon: str
    description: str
    best_for: str
    price_range: str
    price_numeric: float
    inverter_spec: str
    panels_spec: str
    daily_units: str
    battery_support: Optional[str] = None
    net_metering: bool
    appliance_load: str

    class Config:
        from_attributes = True

class ChatMessageItem(BaseModel):
    sender: str
    text: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessageItem]
    session_id: Optional[str] = None
    product_context: Optional[str] = None

class LeadCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    product_interest: str
    status: Optional[str] = "New"
    city: Optional[str] = "Not specified"
    conversation_note: str

class LeadResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str]
    product_interest: str
    status: str
    city: Optional[str]
    conversation_note: str
    estimated_value: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
