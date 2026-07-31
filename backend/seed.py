import uuid

from app.database import Base, SessionLocal, engine
from app.models import Vehicle

SEED = [
    {
        "license_plate": "TX-4821",
        "make": "Ford",
        "model": "F-350",
        "status": "Active",
        "kilometers": 48200,
        "year": 2021,
        "color": "White",
        "vin": "1FT8W3BT5MED12345",
        "notes": "Primary work truck.",
        "image_url": None,
    },
    {
        "license_plate": "CA-9910",
        "make": "Mercedes",
        "model": "Sprinter",
        "status": "Maintenance",
        "kilometers": 91500,
        "year": 2019,
        "color": "Silver",
        "vin": "WD3PE7CD5KP123456",
        "notes": "Awaiting brake service.",
        "image_url": None,
    },
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Vehicle).count() > 0:
            print("Database already has vehicles; skipping seed.")
            return

        for item in SEED:
            db.add(Vehicle(id=str(uuid.uuid4()), **item))

        db.commit()
        print("Seeded vehicles.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
