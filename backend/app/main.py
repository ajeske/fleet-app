from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import BASE_DIR, Base, engine
from app.routers import vehicle_records, vehicles
from app.storage import ensure_upload_dirs
import app.models  # noqa: F401 — register models for create_all

ensure_upload_dirs()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fleet Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles.router, prefix="/api")
app.include_router(vehicle_records.router, prefix="/api")

uploads_dir = BASE_DIR / "data" / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}
