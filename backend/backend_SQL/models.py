# models.py
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Text
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Farmer(Base):
    __tablename__ = "farmer"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farms = relationship("Farm", back_populates="farmer")


class Farm(Base):
    __tablename__ = "farm"
    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey("farmer.id"), nullable=False)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    area_hectares = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="farms")
    crops = relationship("Crop", back_populates="farm")
    activities = relationship("Activity", back_populates="farm")


class Crop(Base):
    __tablename__ = "crop"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farm.id"), nullable=False)
    name = Column(String, nullable=False)
    planting_date = Column(DateTime, nullable=True)
    expected_harvest_date = Column(DateTime, nullable=True)
    metadata = Column(JSON, nullable=True)

    farm = relationship("Farm", back_populates="crops")


class Activity(Base):
    __tablename__ = "activity"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farm.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crop.id"), nullable=True)
    type = Column(String, nullable=False)  # e.g., irrigation, pesticide, fertiliser
    timestamp = Column(DateTime, default=datetime.utcnow)
    performed_by = Column(String, nullable=True)
    details = Column(JSON, nullable=True)  # e.g., {amount: 10, unit: 'liters'}

    farm = relationship("Farm", back_populates="activities")


class Weather(Base):
    __tablename__ = "weather"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farm.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature_c = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    wind_speed_m_s = Column(Float, nullable=True)
    raw = Column(JSON, nullable=True)  # full payload if needed


class MarketPrice(Base):
    __tablename__ = "market_price"
    id = Column(Integer, primary_key=True)
    crop_name = Column(String, nullable=False)
    market = Column(String, nullable=True)
    price_per_kg = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, nullable=True)


# RL-related tables
class RLExperience(Base):
    __tablename__ = "rl_experience"
    id = Column(Integer, primary_key=True)
    state = Column(JSON, nullable=False)
    action = Column(JSON, nullable=False)
    reward = Column(Float, nullable=False)
    next_state = Column(JSON, nullable=True)
    done = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, nullable=True)


class RLModelMetadata(Base):
    __tablename__ = "rl_model_metadata"
    id = Column(Integer, primary_key=True)
    version = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    path = Column(String, nullable=True)   # file path / S3 path
    notes = Column(JSON, nullable=True)
