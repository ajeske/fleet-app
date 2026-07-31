import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Vehicle
from app.schemas import VehicleCreate, VehicleRead, VehicleUpdate

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

ALLOWED_STATUSES = {"Active", "Maintenance", "Inactive", "Sold"}


@router.get("", response_model=list[VehicleRead])
def list_vehicles(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle)

    if status:
        query = query.filter(Vehicle.status == status)

    return query.order_by(Vehicle.license_plate).all()


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})
    return vehicle


@router.post("", response_model=VehicleRead, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    if payload.status not in ALLOWED_STATUSES:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid status: {payload.status}"},
        )

    license_plate = payload.license_plate.strip()
    make = payload.make.strip()
    model = payload.model.strip()

    if not all([license_plate, make, model]):
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})

    vehicle = Vehicle(
        id=str(uuid.uuid4()),
        license_plate=license_plate,
        make=make,
        model=model,
        status=payload.status,
        kilometers=0,
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: str,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})

    data = payload.model_dump(exclude_unset=True)

    if "status" in data and data["status"] is not None:
        if data["status"] not in ALLOWED_STATUSES:
            return JSONResponse(
                status_code=400,
                content={"error": f"Invalid status: {data['status']}"},
            )

    for field in ("license_plate", "make", "model", "color", "vin", "notes", "image_url"):
        if field in data and isinstance(data[field], str):
            data[field] = data[field].strip() or None if field in ("color", "vin", "notes", "image_url") else data[field].strip()

    for field in ("license_plate", "make", "model"):
        if field in data and not data[field]:
            return JSONResponse(status_code=400, content={"error": "Missing required fields"})

    for key, value in data.items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle
