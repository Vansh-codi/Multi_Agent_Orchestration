# backend/routes/tools.py
import structlog
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from routes.dependencies import get_current_user
from tools.rag_retriever import add_documents
from tools.rag_retriever import (
    add_documents,
    _collection,
)
from tools.file_processors import process_csv, process_ocr
from services.db import get_db
from services.activity import log_activity
log = structlog.get_logger()
router = APIRouter(prefix="/tools", tags=["tools"])

MAX_SIZE = 10 * 1024 * 1024  # 10MB

# ── CSV / Excel ───────────────────────────────────────────────

@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    user_id = str(user["user_id"])
    filename = Path(file.filename or "").name
    ext = Path(filename).suffix.lower()

    if ext not in {".csv", ".xlsx", ".xls"}:
        raise HTTPException(400, "Only .csv, .xlsx, .xls allowed")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large (max 10MB)")

    try:
        chunks, preview = process_csv(content, filename)

        ids = [
            f"{user_id}_csv_{filename}_{i}"
            for i in range(len(chunks))
        ]

        add_documents(
            texts=chunks,
            ids=ids,
            filename=f"csv_{filename}",
            user_id=user_id,
        )

        # Save to DB
        pool = await get_db()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO uploaded_files
                (
                    user_id,
                    filename,
                    chunk_count
                )
                VALUES
                (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (user_id, filename)
                DO UPDATE SET
                    chunk_count = EXCLUDED.chunk_count
                """,
                user_id,
                f"csv_{filename}",
                len(chunks),
            )

        log.info("csv_indexed", filename=filename, chunks=len(chunks), user=user_id)
        await log_activity(
            "file",
            "CSV indexed",
            filename,
        )
        return {
            "success": True,
            "filename": f"csv_{filename}",
            "chunks": len(chunks),
            "preview": preview,
            "message":  f"✓ {len(chunks)} chunks indexed from {filename}",

            "pipeline": {
                "upload": "complete",
                "extract": "complete",
                "chunk": "complete",
                "embed": "complete",
                "index": "complete",
                "retrieve": "ready",
            }
        }

      

    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        log.error(
            "csv_upload_failed",
            error=str(e),
        )

        raise HTTPException(
            500,
            "CSV processing failed",
        )


# ── OCR ───────────────────────────────────────────────────────

@router.post("/ocr")
async def upload_ocr(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    user_id = str(user["user_id"])
    filename = Path(file.filename or "").name
    ext = Path(filename).suffix.lower()

    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp"}:
        raise HTTPException(400, "Only image files allowed")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large (max 10MB)")

    try:
        chunks, preview = await process_ocr(content, filename)

        ids = [
            f"{user_id}_ocr_{filename}_{i}"
            for i in range(len(chunks))
        ]

        add_documents(
            texts=chunks,
            ids=ids,
            filename=f"ocr_{filename}",
            user_id=user_id,
        )

        # Save to DB
        pool = await get_db()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO uploaded_files
                (
                    user_id,
                    filename,
                    chunk_count
                )
                VALUES
                (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (user_id, filename)
                DO UPDATE SET
                    chunk_count = EXCLUDED.chunk_count
                """,
                user_id,
                f"ocr_{filename}",
                len(chunks),
            )
        log.info("ocr_indexed", filename=filename, chunks=len(chunks), user=user_id)
        await log_activity(
            "file",
            "OCR indexed",
            filename,
        )

        return {
            "success": True,
            "filename": f"ocr_{filename}",
            "chunks": len(chunks),
            "preview": preview,
            "message":  f"✓ Extracted {len(chunks)} chunks from image",

            "pipeline": {
                "upload": "complete",
                "extract": "complete",
                "chunk": "complete",
                "embed": "complete",
                "index": "complete",
                "retrieve": "ready",
            }
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        log.error(
            "ocr_upload_failed",
            error=str(e),
        )

        raise HTTPException(
            500,
            "OCR processing failed",
        )

@router.get("/stats")
async def get_tool_stats(
    user=Depends(get_current_user),
):
    user_id = str(user["user_id"])

    pool = await get_db()

    async with pool.acquire() as conn:

        row = await conn.fetchrow(
            """
            SELECT
                COUNT(*) AS documents,
                COALESCE(SUM(chunk_count), 0) AS chunks
            FROM uploaded_files
            WHERE user_id = $1
            """,
            user_id,
        )

    return {
        "documents": row["documents"],
        "chunks": row["chunks"],
        "requests": row["documents"],
    }

@router.get("/jobs")
async def get_tool_jobs(
    user=Depends(get_current_user),
):
    user_id = str(user["user_id"])

    pool = await get_db()

    async with pool.acquire() as conn:

        rows = await conn.fetch(
            """
            SELECT filename, chunk_count
            FROM uploaded_files
            WHERE user_id = $1
            ORDER BY filename DESC
            LIMIT 10
            """,
            user_id,
        )

    return {
        "jobs": [
            {
                "file": row["filename"],
                "status": "Completed",
                "chunks": row["chunk_count"],
            }
            for row in rows
        ]
    }