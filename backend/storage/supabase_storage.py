# backend/storage/supabase_storage.py

import os
import structlog
from supabase import create_client
from config import get_settings
from services.activity import log_activity
settings = get_settings()
log = structlog.get_logger()

supabase = create_client(
    settings.supabase_url,
    settings.supabase_key,
)

BUCKET = "generated-code"


async def upload_generated_file(filepath: str, user_id: str) -> dict:
    """
    Upload file to Supabase under user folder.

    Storage path:
        generated-code/{user_id}/{filename}

    Returns:
        {
            "storage_path": "...",
            "signed_url": "..."
        }
    """

    filename = os.path.basename(filepath)

    # Per-user isolated folder
    storage_path = f"{user_id}/{filename}"

    try:

        # ── Upload file ───────────────────────────────────────
        with open(filepath, "rb") as f:

            supabase.storage \
                .from_(BUCKET) \
                .upload(
                    storage_path,
                    f,
                    {"upsert": "true"}
                )

        # ── Generate signed URL (24h expiry) ─────────────────
        signed_response = (
            supabase.storage
            .from_(BUCKET)
            .create_signed_url(
                storage_path,
                60 * 60 * 24  # 24 hours
            )
        )

        signed_url = signed_response.get("signedURL")

        log.info(
            "file_uploaded",
            user=user_id,
            filename=filename,
            storage_path=storage_path,
            signed_url=signed_url,
        )
        await log_activity(
            "file",
            "File generated",
            filename,
        )

        # ── Delete local file after upload ───────────────────
        try:

            os.remove(filepath)

            log.info(
                "local_file_deleted",
                filepath=filepath
            )

        except Exception as delete_err:

            log.warning(
                "local_delete_failed",
                filepath=filepath,
                error=str(delete_err)
            )

        return {
            "storage_path": storage_path,
            "signed_url": signed_url,
        }

    except Exception as e:

        log.error(
            "supabase_upload_failed",
            user=user_id,
            filename=filename,
            error=str(e)
        )

        return {}


async def list_user_files(user_id: str) -> list[dict]:
   
    """
    List all files belonging to this user only.
    Generates fresh signed URLs dynamically.
    """

    try:

       
        files = (
            supabase.storage
            .from_(BUCKET)
            .list(path=user_id)
        )

        

        result = []

        for f in files:

            if not f.get("name"):
                continue

            filename = f["name"]

            storage_path = f"{user_id}/{filename}"

            signed_response = (
                supabase.storage
                .from_(BUCKET)
                .create_signed_url(
                    storage_path,
                    60 * 60 * 24
                )
            )

            signed_url = signed_response.get("signedURL")

            result.append({
                "name": filename,
                "size": (
                    f.get("metadata", {})
                    .get("size", 0)
                ),
                "storage_path": storage_path,
                "url": signed_url,
                "created_at": f.get("created_at", ""),
            })

        return result

    except Exception as e:

        log.error(
            "list_files_failed",
            user=user_id,
            error=str(e)
        )

        return []


async def delete_user_file(user_id: str, filename: str) -> bool:
    """
    Delete a specific file belonging to this user.
    """

    try:

        storage_path = f"{user_id}/{filename}"

        supabase.storage \
            .from_(BUCKET) \
            .remove([storage_path])

        log.info(
            "file_deleted",
            user=user_id,
            filename=filename,
            storage_path=storage_path
        )
        await log_activity(
    "file",
    "File deleted",
    filename,
)

        return True

    except Exception as e:

        log.error(
            "delete_failed",
            user=user_id,
            filename=filename,
            error=str(e)
        )

        return False