import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Accident, InsurancePolicy, MaintenanceRecord, Payment, Vehicle
from app.schemas import (
    AccidentRead,
    InsuranceCreate,
    InsuranceRead,
    MaintenanceCreate,
    MaintenanceRead,
    PaymentCreate,
    PaymentRead,
)
from app.storage import save_accident_pdf

router = APIRouter(prefix="/vehicles/{vehicle_id}", tags=["vehicle-records"])

ALLOWED_PAYMENT_DIRECTIONS = {"received", "paid"}


def _get_vehicle_or_404(vehicle_id: str, db: Session):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        return None
    return vehicle


# --- Accidents (PDF upload on create) ---

@router.get("/accidents", response_model=list[AccidentRead])
def list_accidents(vehicle_id: str, db: Session = Depends(get_db)):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})
    return (
        db.query(Accident)
        .filter(Accident.vehicle_id == vehicle_id)
        .order_by(Accident.date.desc())
        .all()
    )


@router.post("/accidents", response_model=AccidentRead, status_code=201)
async def create_accident(
    vehicle_id: str,
    date: str = Form(...),
    description: str = Form(...),
    document: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})

    date = date.strip()
    description = description.strip()
    if not date or not description:
        return JSONResponse(status_code=400, content={"error": "Date and description are required"})

    document_path = None
    document_name = None
    if document is not None and document.filename:
        try:
            document_path, document_name = await save_accident_pdf(document)
        except ValueError as exc:
            return JSONResponse(status_code=400, content={"error": str(exc)})

    accident = Accident(
        id=str(uuid.uuid4()),
        vehicle_id=vehicle_id,
        date=date,
        description=description,
        document_path=document_path,
        document_name=document_name,
    )
    db.add(accident)
    db.commit()
    db.refresh(accident)
    return accident


@router.delete("/accidents/{accident_id}", status_code=204)
def delete_accident(vehicle_id: str, accident_id: str, db: Session = Depends(get_db)):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})

    accident = (
        db.query(Accident)
        .filter(Accident.id == accident_id, Accident.vehicle_id == vehicle_id)
        .first()
    )
    if not accident:
        return JSONResponse(status_code=404, content={"error": "Accident not found"})

    db.delete(accident)
    db.commit()
    return None


# --- Maintenance ---

@router.get("/maintenance", response_model=list[MaintenanceRead])
def list_maintenance(vehicle_id: str, db: Session = Depends(get_db)):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})
    return (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.vehicle_id == vehicle_id)
        .order_by(MaintenanceRecord.date.desc())
        .all()
    )


@router.post("/maintenance", response_model=MaintenanceRead, status_code=201)
def create_maintenance(
    vehicle_id: str,
    payload: MaintenanceCreate,
    db: Session = Depends(get_db),
):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})

    date = payload.date.strip()
    service_type = payload.service_type.strip()
    if not date or not service_type:
        return JSONResponse(status_code=400, content={"error": "Date and service type are required"})

    record = MaintenanceRecord(
        id=str(uuid.uuid4()),
        vehicle_id=vehicle_id,
        date=date,
        service_type=service_type,
        cost=payload.cost,
        notes=(payload.notes or "").strip() or None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# --- Payments ---

@router.get("/payments", response_model=list[PaymentRead])
def list_payments(vehicle_id: str, db: Session = Depends(get_db)):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})
    return (
        db.query(Payment)
        .filter(Payment.vehicle_id == vehicle_id)
        .order_by(Payment.date.desc())
        .all()
    )


@router.post("/payments", response_model=PaymentRead, status_code=201)
def create_payment(
    vehicle_id: str,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})

    date = payload.date.strip()
    direction = payload.direction.strip().lower()
    if not date:
        return JSONResponse(status_code=400, content={"error": "Date is required"})
    if direction not in ALLOWED_PAYMENT_DIRECTIONS:
        return JSONResponse(
            status_code=400,
            content={"error": "Direction must be 'received' or 'paid'"},
        )

    payment = Payment(
        id=str(uuid.uuid4()),
        vehicle_id=vehicle_id,
        date=date,
        amount=payload.amount,
        direction=direction,
        insurer=(payload.insurer or "").strip() or None,
        notes=(payload.notes or "").strip() or None,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


# --- Insurance ---

@router.get("/insurance", response_model=list[InsuranceRead])
def list_insurance(vehicle_id: str, db: Session = Depends(get_db)):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})
    return (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.vehicle_id == vehicle_id)
        .order_by(InsurancePolicy.start_date.desc())
        .all()
    )


@router.post("/insurance", response_model=InsuranceRead, status_code=201)
def create_insurance(
    vehicle_id: str,
    payload: InsuranceCreate,
    db: Session = Depends(get_db),
):
    if not _get_vehicle_or_404(vehicle_id, db):
        return JSONResponse(status_code=404, content={"error": "Vehicle not found"})

    provider = payload.provider.strip()
    policy_number = payload.policy_number.strip()
    if not provider or not policy_number:
        return JSONResponse(
            status_code=400,
            content={"error": "Provider and policy number are required"},
        )

    policy = InsurancePolicy(
        id=str(uuid.uuid4()),
        vehicle_id=vehicle_id,
        provider=provider,
        policy_number=policy_number,
        coverage=(payload.coverage or "").strip() or None,
        start_date=(payload.start_date or "").strip() or None,
        end_date=(payload.end_date or "").strip() or None,
        premium=payload.premium,
        notes=(payload.notes or "").strip() or None,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy
