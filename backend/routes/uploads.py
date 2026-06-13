from pathlib import Path
import structlog
import asyncpg

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends,
)

from routes.dependencies import get_current_user
from tools.rag_retriever import add_documents
from config import get_settings
from services.db import get_db
settings = get_settings()

log = structlog.get_logger()

router = APIRouter(tags=["uploads"])

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".txt",
    ".pdf",
    ".py",
    ".md",
    ".json",
    ".csv",
}
ALLOWED_MIME_TYPES = {
    "text/plain",
    "application/pdf",
    "application/json",
    "text/markdown",
    "text/csv",}
    

MAX_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):

    # UUID user id
    user_id = str(user["user_id"])

    # Validate extension
    ext = Path(
        file.filename or ""
    ).suffix.lower()


    if ext not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=f"File type {ext} not allowed.",
        )
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"MIME type {file.content_type} not allowed.",
        )

    try:

        content = await file.read()

        if len(content) > MAX_SIZE:

            raise HTTPException(
                status_code=400,
                detail="File too large (max 10MB)",
            )

        # ── Save locally ───────────────────────

        # file_path = UPLOAD_DIR / file.filename

        filename = Path(file.filename).name

        file_path = UPLOAD_DIR / f"{user_id}_{filename}"

        file_path.write_bytes(content)

        # ── Chunk for RAG ──────────────────────

        text = content.decode(
            "utf-8",
            errors="ignore",
        )

        chunks = [
            text[i:i + 500]
            for i in range(
                0,
                len(text),
                500,
            )
        ]

        # User-scoped IDs
        ids = [
            f"{user_id}_{filename}_{i}"
            for i in range(len(chunks))
        ]

        # ── Store in ChromaDB ──────────────────

        add_documents(
            texts=chunks,
            ids=ids,
            filename=filename,
            user_id=user_id,
        )

        # ── Save upload record in Neon ─────────

        pool = await get_db()

        async with pool.acquire() as conn:

            await conn.execute(
                """
                INSERT INTO uploaded_files
                (
                    user_id,
                    filename
                )
                VALUES ($1, $2)
                ON CONFLICT (user_id, filename)
                DO NOTHING
                """,
                user_id,
                filename,
            )

        # ── Logging ───────────────────────────

        log.info(
            "file_uploaded",
            filename=file.filename,
            user=user_id,
            chunks=len(chunks),
        )
        return {
            "success": True,
            "filename": file.filename,
            "chunks": len(chunks),
            "user": user_id,
        }

    except HTTPException:

        raise

    except Exception as e:

        log.error(
            "upload_failed",
            error=str(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
@router.get("/uploaded-files")
async def get_uploaded_files(
        user=Depends(get_current_user)
    ):
        pool = await get_db()

        async with pool.acquire() as conn:

            rows = await conn.fetch(
                """
                SELECT DISTINCT filename
                FROM uploaded_files
                WHERE user_id = $1
                ORDER BY filename
                """,
                user["user_id"],
            )
            return {
                "files": [
                    row["filename"]
                    for row in rows
                ]
            }

   