from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    license_plate: str = Field(alias="licensePlate")
    make: str
    model: str
    status: str = "Active"

    model_config = ConfigDict(populate_by_name=True)


class VehicleUpdate(BaseModel):
    license_plate: str | None = Field(default=None, alias="licensePlate")
    make: str | None = None
    model: str | None = None
    status: str | None = None
    image_url: str | None = Field(default=None, alias="imageUrl")
    kilometers: int | None = Field(default=None, ge=0)
    year: int | None = None
    color: str | None = None
    vin: str | None = None
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class VehicleRead(BaseModel):
    id: str
    license_plate: str = Field(serialization_alias="licensePlate")
    make: str
    model: str
    status: str
    image_url: str | None = Field(default=None, serialization_alias="imageUrl")
    kilometers: int = 0
    year: int | None = None
    color: str | None = None
    vin: str | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class AccidentRead(BaseModel):
    id: str
    vehicle_id: str = Field(serialization_alias="vehicleId")
    date: str
    description: str
    document_path: str | None = Field(default=None, serialization_alias="documentPath")
    document_name: str | None = Field(default=None, serialization_alias="documentName")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class MaintenanceCreate(BaseModel):
    date: str
    service_type: str = Field(alias="serviceType")
    cost: float = 0
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class MaintenanceRead(BaseModel):
    id: str
    vehicle_id: str = Field(serialization_alias="vehicleId")
    date: str
    service_type: str = Field(serialization_alias="serviceType")
    cost: float
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaymentCreate(BaseModel):
    date: str
    amount: float
    direction: str  # received | paid
    insurer: str | None = None
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class PaymentRead(BaseModel):
    id: str
    vehicle_id: str = Field(serialization_alias="vehicleId")
    date: str
    amount: float
    direction: str
    insurer: str | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class InsuranceCreate(BaseModel):
    provider: str
    policy_number: str = Field(alias="policyNumber")
    coverage: str | None = None
    start_date: str | None = Field(default=None, alias="startDate")
    end_date: str | None = Field(default=None, alias="endDate")
    premium: float | None = None
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class InsuranceRead(BaseModel):
    id: str
    vehicle_id: str = Field(serialization_alias="vehicleId")
    provider: str
    policy_number: str = Field(serialization_alias="policyNumber")
    coverage: str | None = None
    start_date: str | None = Field(default=None, serialization_alias="startDate")
    end_date: str | None = Field(default=None, serialization_alias="endDate")
    premium: float | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
