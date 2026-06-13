
import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.responses import (
    RedirectResponse,
    FileResponse,
)

from routes.dependencies import (
    get_current_user,
)

router = APIRouter()

# ─────────────────────────────────────────────
# Supabase
# ─────────────────────────────────────────────

try:

    from storage.supabase_storage import (
        list_user_files,
        delete_user_file,
    )

    from config import get_settings
    from supabase import create_client

    settings = get_settings()

    supabase = create_client(
        settings.supabase_url,
        settings.supabase_key,
    )

    SUPABASE_ENABLED = True

except Exception:

    SUPABASE_ENABLED = False

BUCKET = "generated-code"

# ─────────────────────────────────────────────
# List generated files
# ─────────────────────────────────────────────


@router.get("/generated-files")
async def list_files(
    user=Depends(get_current_user)
):
    """
    Returns only THIS user's files.
    """

    # UUID user id
    user_id = str(user["id"])

    # ── Supabase mode ───────────────────────

    if SUPABASE_ENABLED:

        files = await list_user_files(
            user_id
        )

        # Frontend expects:
        # { "files": [...] }

        return {
            "files": files
        }

    # ── Local fallback (dev only) ───────────

    local_dir = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "generated_code",
    )

    if not os.path.exists(local_dir):

        return {
            "files": []
        }

    files = []

    for f in os.listdir(local_dir):

        if not f.endswith(".py"):
            continue

        path = os.path.join(
            local_dir,
            f
        )

        files.append({
            "name": f,

            "size": os.path.getsize(path),

            "url": "",
        })

    return {
        "files": files
    }


# ─────────────────────────────────────────────
# Download / redirect to signed URL
# ─────────────────────────────────────────────


@router.get("/generated-files/{filename}")
async def get_file(
    filename: str,
    user=Depends(get_current_user)
):
    """
    Redirect to a fresh signed URL
    for THIS user's file only.
    """

    user_id = str(user["id"])

    # ── Supabase mode ───────────────────────

    if SUPABASE_ENABLED:

        storage_path = (
            f"{user_id}/{filename}"
        )

        signed_response = (
            supabase.storage
            .from_(BUCKET)
            .create_signed_url(
                storage_path,
                60 * 60 * 24
            )
        )

        signed_url = (
            signed_response
            .get("signedURL")
        )

        if not signed_url:

            raise HTTPException(
                status_code=404,
                detail="File not found"
            )

        return RedirectResponse(
            url=signed_url
        )

    # ── Local fallback ──────────────────────

    local_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "generated_code",
        filename,
    )

    if not os.path.exists(local_path):

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return FileResponse(local_path)


# ─────────────────────────────────────────────
# Delete file
# ─────────────────────────────────────────────


from pathlib import PurePath
from fastapi import HTTPException, Depends

@router.delete("/generated-files/{filename}")
async def delete_file(
    filename: str,
    user=Depends(get_current_user)
):
    """
    Delete only THIS user's file.
    """

    # Prevent path traversal attempts
    filename = PurePath(filename).name

    if (
        not filename
        or "/" in filename
        or "\\" in filename
        or ".." in filename
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid filename"
        )

    user_id = str(user["id"])

    if SUPABASE_ENABLED:

        success = await delete_user_file(
            user_id,
            filename,
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Delete failed"
            )

        return {
            "success": True,
            "deleted": filename,
        }

    raise HTTPException(
        status_code=404,
        detail="File storage unavailable"
    )