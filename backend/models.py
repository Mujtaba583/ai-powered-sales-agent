from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    """Administrative user account with password hashing and roles"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    """Solar products catalog (Residential, Commercial, Solar Backup)"""
    __tablename__ = "products"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) # Residential, Commercial, Backup
    badge = Column(String(50), nullable=True)     # Entry, Popular, Premium, Scale
    icon = Column(String(20), default="☀️")
    description = Column(Text, nullable=False)
    best_for = Column(String(100), nullable=False)
    price_range = Column(String(50), nullable=False)
    price_numeric = Column(Float, nullable=False)
    inverter_spec = Column(String(100), nullable=False)
    panels_spec = Column(String(100), nullable=False)
    daily_units = Column(String(50), nullable=False)
    battery_support = Column(String(100), nullable=True)
    net_metering = Column(Boolean, default=True)
    appliance_load = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Lead(Base):
    """Customer sales leads captured by AI Voice/Chat Assistant"""
    __tablename__ = "leads"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    product_interest = Column(String(100), nullable=False)
    status = Column(String(20), default="New") # Hot, Warm, New, Closed
    city = Column(String(100), default="Online Inquiry")
    conversation_note = Column(Text, nullable=False)
    estimated_value = Column(String(50), default="PKR 1.35M")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Associated conversation records
    messages = relationship("ConversationMessage", back_populates="lead", cascade="all, delete-orphan")

class ConversationMessage(Base):
    """Detailed conversation history records as required by FYP specifications"""
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(String(50), ForeignKey("leads.id"), nullable=True)
    session_id = Column(String(100), index=True, nullable=False)
    sender = Column(String(20), nullable=False) # 'agent' or 'customer'
    message_text = Column(Text, nullable=False)
    is_voice = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="messages")
