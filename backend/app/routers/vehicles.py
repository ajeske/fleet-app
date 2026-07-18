import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Vehicle
from app.schemas import VehicleCreate, VehicleRead

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

ALLOWED_STATUSES = {"Active", "Maintenance", "Retired", "Out of Service"}


@router.get("", response_model=list[VehicleRead])
def list_vehicles(
    subcategoryId: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle)

    if subcategoryId:
        query = query.filter(Vehicle.subcategory_id == subcategoryId)

    return query.order_by(Vehicle.license_plate).all()


@router.post("", response_model=VehicleRead, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    if payload.status not in ALLOWED_STATUSES:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid status: {payload.status}"},
        )

    subcategory_id = payload.subcategory_id.strip()
    license_plate = payload.license_plate.strip()
    make = payload.make.strip()
    model = payload.model.strip()

    if not all([subcategory_id, license_plate, make, model]):
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})

    vehicle = Vehicle(
        id=str(uuid.uuid4()),
        subcategory_id=subcategory_id,
        license_plate=license_plate,
        make=make,
        model=model,
        status=payload.status,
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle
