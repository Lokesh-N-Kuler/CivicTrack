import os
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


class StorageService:
    """
    Abstracted storage service for complaint attachments.
    Defaults to secure local filesystem storage with path traversal prevention,
    size enforcement, and randomized file names.
    """
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def validate_file(self, file: UploadFile, content: bytes) -> str:
        # Check size
        if len(content) > settings.MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image size exceeds the maximum limit of {settings.MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB."
            )

        # Check declared MIME type
        content_type = file.content_type or ""
        if content_type.lower() not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{content_type}'. Allowed types: JPEG, PNG, WEBP."
            )

        # Basic magic bytes check for security
        # JPEG: FF D8 FF
        # PNG: 89 50 4E 47 0D 0A 1A 0A
        # WEBP: RIFF....WEBP
        if content_type == "image/jpeg" and not content.startswith(b"\xff\xd8\xff"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File content does not match JPEG format.")
        elif content_type == "image/png" and not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File content does not match PNG format.")
        elif content_type == "image/webp" and not (content[:4] == b"RIFF" and content[8:12] == b"WEBP"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File content does not match WEBP format.")

        # Determine safe extension
        ext_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        }
        return ext_map.get(content_type, ".jpg")

    def save_image(self, file: UploadFile, content: bytes) -> Tuple[str, str, int]:
        """
        Saves image and returns (randomized_filename, safe_absolute_path, file_size)
        """
        extension = self.validate_file(file, content)
        
        # Generate random UUID filename to prevent collisions and path traversal
        random_filename = f"{uuid.uuid4().hex}{extension}"
        
        # Safe path resolution ensuring no directory escape
        safe_path = os.path.abspath(os.path.join(self.upload_dir, os.path.basename(random_filename)))
        if not safe_path.startswith(os.path.abspath(self.upload_dir)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid destination path.")

        with open(safe_path, "wb") as f:
            f.write(content)

        return random_filename, safe_path, len(content)


storage_service = StorageService()
