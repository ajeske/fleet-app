import uuid

from app.database import SessionLocal
from app.models import Vehicle

SEED = [
    {
        "subcategory_id": "trucks-heavy",
        "license_plate": "TX-4821",
        "make": "Ford",
        "model": "F-350",
        "status": "Active",
    },
    {
        "subcategory_id": "vans-cargo",
        "license_plate": "CA-9910",
        "make": "Mercedes",
        "model": "Sprinter",
        "status": "Maintenance",
    },
]


def main():
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
