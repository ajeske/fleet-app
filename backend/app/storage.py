import uuid
from pathlib import Path

from fastapi import UploadFile

from app.database import BASE_DIR

UPLOADS_ROOT = BASE_DIR / "data" / "uploads"
ACCIDENTS_DIR = UPLOADS_ROOT / "accidents"

ALLOWED_PDF_TYPES = {"application/pdf"}


def ensure_upload_dirs() -> None:
    ACCIDENTS_DIR.mkdir(parents=True, exist_ok=True)


async def save_accident_pdf(upload: UploadFile) -> tuple[str, str]:
    """Save a PDF to disk. Returns (public_path, original_filename)."""
    ensure_upload_dirs()

    content_type = (upload.content_type or "").lower()
    filename = upload.filename or "document.pdf"
    if content_type and content_type not in ALLOWED_PDF_TYPES:
        if not filename.lower().endswith(".pdf"):
            raise ValueError("Only PDF documents are allowed")

    stored_name = f"{uuid.uuid4()}.pdf"
    dest = ACCIDENTS_DIR / stored_name

    data = await upload.read()
    if not data:
        raise ValueError("Uploaded file is empty")

    dest.write_bytes(data)
    return f"/uploads/accidents/{stored_name}", filename
