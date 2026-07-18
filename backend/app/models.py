from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    subcategory_id: Mapped[str] = mapped_column(String, nullable=False)
    license_plate: Mapped[str] = mapped_column(String, nullable=False)
    make: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Active")
