# main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os

from models import Base, Farmer, Farm, Crop, Activity, Weather, MarketPrice, RLExperience, RLModelMetadata

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/agrodb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

app = FastAPI(title="Agro-RL Backend")

# Create tables (for dev); in prod use Alembic
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

### Pydantic schemas (minimal)
class FarmerCreate(BaseModel):
    name: str
    phone: Optional[str]
    email: Optional[str]

class FarmerOut(FarmerCreate):
    id: int

    class Config:
        orm_mode = True

# Create Farmer
@app.post("/farmers", response_model=FarmerOut)
def create_farmer(payload: FarmerCreate, db: Session = Depends(get_db)):
    farmer = Farmer(name=payload.name, phone=payload.phone, email=payload.email)
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer

@app.get("/farmers", response_model=List[FarmerOut])
def list_farmers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Farmer).offset(skip).limit(limit).all()

# Add similarly: farms, crops, activities, weather, market_price CRUD endpoints
# I'll show RL endpoints below

from fastapi import Body
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session

# RL request/response schemas
class StateRequest(BaseModel):
    state: dict
    meta: Optional[dict] = None

class ActionResponse(BaseModel):
    action: dict
    model_version: Optional[str] = None
    timestamp: datetime

class ExperienceIn(BaseModel):
    state: dict
    action: dict
    reward: float
    next_state: Optional[dict] = None
    done: bool = False
    meta: Optional[dict] = None

@app.post("/rl/action", response_model=ActionResponse)
def get_action(req: StateRequest, db: Session = Depends(get_db)):
    """
    Query the RL model to get an action for the given state.
    For now, this endpoint returns a stub/random action or calls a local model.
    Replace the stub with your inference call (PyTorch/TensorFlow/torchserve/etc.)
    """
    # Example stub action (replace with real model inference)
    # TODO: load model from RLModelMetadata.path or a model service
    action = {"type": "irrigate", "amount_liters": 10}

    # fetch latest model metadata if present
    meta = db.query(RLModelMetadata).order_by(RLModelMetadata.created_at.desc()).first()
    version = meta.version if meta else "none"

    return ActionResponse(action=action, model_version=version, timestamp=datetime.utcnow())


@app.post("/rl/experience", status_code=201)
def push_experience(exp: ExperienceIn, db: Session = Depends(get_db)):
    x = RLExperience(
        state=exp.state,
        action=exp.action,
        reward=exp.reward,
        next_state=exp.next_state,
        done=exp.done,
        metadata=exp.meta
    )
    db.add(x)
    db.commit()
    db.refresh(x)
    return {"id": x.id, "status": "stored"}


@app.get("/data/experience", response_model=List[dict])
def fetch_experiences(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    rows = db.query(RLExperience).order_by(RLExperience.timestamp.desc()).offset(skip).limit(limit).all()
    return [ {
        "id": r.id, "state": r.state, "action": r.action, "reward": r.reward,
        "next_state": r.next_state, "done": r.done, "timestamp": r.timestamp
    } for r in rows]

@app.post("/rl/train")
def trigger_train(db: Session = Depends(get_db), async_train: bool = True):
    """
    Trigger a training job. Implementation options:
      - enqueue a job in a worker (Celery/RQ) and return job id
      - spawn a background thread (not recommended for long jobs)
      - call an external training microservice
    Here we will return a stub response and create a new RLModelMetadata row as placeholder.
    """
    # Create placeholder metadata (in reality, training script would update path/version)
    new_meta = RLModelMetadata(version=f"v{int(datetime.utcnow().timestamp())}", description="Training triggered")
    db.add(new_meta)
    db.commit()
    db.refresh(new_meta)
    # TODO: enqueue actual training job (Celery/RQ/Kubernetes job) and update model path when done
    return {"status": "training_enqueued", "model_id": new_meta.id, "version": new_meta.version}
