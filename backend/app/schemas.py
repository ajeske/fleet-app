from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    subcategory_id: str = Field(alias="subcategoryId")
    license_plate: str = Field(alias="licensePlate")
    make: str
    model: str
    status: str = "Active"

    model_config = ConfigDict(populate_by_name=True)


class VehicleRead(BaseModel):
    id: str
    subcategory_id: str = Field(serialization_alias="subcategoryId")
    license_plate: str = Field(serialization_alias="licensePlate")
    make: str
    model: str
    status: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
