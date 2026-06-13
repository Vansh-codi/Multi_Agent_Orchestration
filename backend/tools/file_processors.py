# # backend/tools/file_processors.py
# import io
# import base64
# import httpx
# import structlog
# # from PIL import Image
# import pandas as pd
# from config import get_settings

# log = structlog.get_logger()
# settings = get_settings()


# def process_csv(content: bytes, filename: str) -> tuple[list[str], str]:
#     """Parse CSV/Excel → summary + chunks"""
#     try:
#         if filename.endswith(".csv"):
#             df = pd.read_csv(io.BytesIO(content))
#         else:
#             df = pd.read_excel(io.BytesIO(content))

#         rows, cols = df.shape
#         columns = list(df.columns)
#         column_types = {
#             col: str(df[col].dtype)
#             for col in df.columns
#         }
#         sample = df.head(10).to_string(index=False)

#         numeric_summary = ""
#         numeric_cols = df.select_dtypes(include="number").columns
#         if len(numeric_cols) > 0:
#             numeric_summary = f"\nNumeric Summary:\n{df[numeric_cols].describe().to_string()}"

#         summary = f"""
#         File: {filename}

#         Rows: {rows}
#         Columns: {cols}

#         Column Names:
#         {', '.join(columns)}

#         Column Types:
#         {column_types}

#         {numeric_summary}

#         Sample (first 10 rows):

#         {sample}
#         """.strip()

#         chunks = [summary]
#         CHUNK_ROWS = 25

#         for i in range(0, len(df), CHUNK_ROWS):

#             chunk_df = df.iloc[i:i + CHUNK_ROWS]

#             start_row = i + 1
#             end_row = min(i + CHUNK_ROWS, len(df))

#             chunks.append(
#                 f"""
#         Chunk {i // CHUNK_ROWS + 1}

#         Rows {start_row}-{end_row}

#         Columns:
#         {', '.join(df.columns)}

#         {chunk_df.to_string(index=False)}
#         """.strip()
#             )

#         preview = f"{rows} rows × {cols} cols — {', '.join(columns[:5])}"
#         return chunks, preview

#     except Exception as e:
#         log.error("csv_processing_failed", error=str(e))
#         raise ValueError(f"Could not process CSV: {e}")


# async def process_ocr(content: bytes, filename: str) -> tuple[list[str], str]:
#     """Extract text from image using Anthropic Vision — no install needed"""
#     try:
#                 # Verify uploaded file is a real image
#         # try:
#         #     Image.open(io.BytesIO(content)).verify()
#         # except Exception:
#         #     raise ValueError(
#         #         "Invalid image file"
#         #     )
        
#         # Detect mime type from filename
#         ext = filename.lower().split(".")[-1]
#         mime_map = {
#             "jpg": "image/jpeg", "jpeg": "image/jpeg",
#             "png": "image/png", "gif": "image/gif",
#             "webp": "image/webp",
#         }
#         media_type = mime_map.get(ext, "image/jpeg")
#         if len(content) > 5 * 1024 * 1024:
#             raise ValueError(
#                 "Image exceeds 5MB OCR limit"
#             )

#         # Base64 encode the image
#         image_b64 = base64.standard_b64encode(content).decode("utf-8")
#         if not settings.anthropic_api_key:
#             raise ValueError(
#                 "OCR service not configured"
#             )
#                 # Call Anthropic Vision API
#         async with httpx.AsyncClient(
#                 timeout=httpx.Timeout(
#                     connect=10,
#                     read=30,
#                     write=10,
#                     pool=10,
#                 )
#             )as client:
#                         response = await client.post(
#                 "https://api.anthropic.com/v1/messages",
#                 headers={
#                     "x-api-key":         settings.anthropic_api_key,
#                     "anthropic-version": "2023-06-01",
#                     "content-type":      "application/json",
#                 },
#                 json={
#                     "model": "claude-3-haiku-20240307",  # cheapest, fast
#                     "max_tokens": 2048,
#                     "messages": [
#                         {
#                             "role": "user",
#                             "content": [
#                                 {
#                                     "type": "image",
#                                     "source": {
#                                         "type":       "base64",
#                                         "media_type": media_type,
#                                         "data":       image_b64,
#                                     },
#                                 },
#                                 {
#                                     "type": "text",
#                                     "text": (
#                                         "Extract ALL text from this image exactly as it appears. "
#                                         "Preserve structure, tables, bullet points. "
#                                         "Return only the extracted text, nothing else."
#                                     ),
#                                 },
#                             ],
#                         }
#                     ],
#                 },
#             )

#         if response.status_code != 200:
#             raise ValueError(
#                 f"Anthropic returned {response.status_code}"
#             )

#         data = response.json()

#         if "content" not in data:
#             raise ValueError(
#                 "Invalid OCR response"
#             )

#         text = (
#             data.get("content", [{}])[0]
#             .get("text", "")
#             .strip()
#         )
#         if not text:
#             raise ValueError("No text found in image")

#         # Chunk every 500 chars
#         chunks = [text[i:i+500] for i in range(0, len(text), 500)]
#         preview = text[:150] + "..." if len(text) > 150 else text

#         return chunks, preview

#     except Exception as e:
#         log.error("ocr_failed", error=str(e))
#         raise ValueError(f"OCR failed: {e}")











# backend/tools/file_processors.py
import io
import base64
import httpx
import structlog
# from PIL import Image
import pandas as pd
import pytesseract
from PIL import Image as PILImage
from config import get_settings

log = structlog.get_logger()
settings = get_settings()


def process_csv(content: bytes, filename: str) -> tuple[list[str], str]:
    """Parse CSV/Excel → summary + chunks"""
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))

        rows, cols = df.shape
        columns = list(df.columns)
        column_types = {
            col: str(df[col].dtype)
            for col in df.columns
        }
        sample = df.head(10).to_string(index=False)

        numeric_summary = ""
        numeric_cols = df.select_dtypes(include="number").columns
        if len(numeric_cols) > 0:
            numeric_summary = f"\nNumeric Summary:\n{df[numeric_cols].describe().to_string()}"

        summary = f"""
        File: {filename}

        Rows: {rows}
        Columns: {cols}

        Column Names:
        {', '.join(columns)}

        Column Types:
        {column_types}

        {numeric_summary}

        Sample (first 10 rows):

        {sample}
        """.strip()

        chunks = [summary]
        CHUNK_ROWS = 25

        for i in range(0, len(df), CHUNK_ROWS):

            chunk_df = df.iloc[i:i + CHUNK_ROWS]

            start_row = i + 1
            end_row = min(i + CHUNK_ROWS, len(df))

            chunks.append(
                f"""
        Chunk {i // CHUNK_ROWS + 1}

        Rows {start_row}-{end_row}

        Columns:
        {', '.join(df.columns)}

        {chunk_df.to_string(index=False)}
        """.strip()
            )

        preview = f"{rows} rows × {cols} cols — {', '.join(columns[:5])}"
        return chunks, preview

    except Exception as e:
        log.error("csv_processing_failed", error=str(e))
        raise ValueError(f"Could not process CSV: {e}")


async def process_ocr(content: bytes, filename: str) -> tuple[list[str], str]:
    """Extract text from image using local Tesseract OCR"""
    try:
        if len(content) > 5 * 1024 * 1024:
            raise ValueError(
                "Image exceeds 5MB OCR limit"
            )

        try:
            img = PILImage.open(io.BytesIO(content))
            img.verify()
            img = PILImage.open(io.BytesIO(content))  # reopen after verify
        except Exception:
            raise ValueError(
                "Invalid image file"
            )

        if img.mode != "RGB":
            img = img.convert("RGB")

        text = pytesseract.image_to_string(img).strip()

        if not text:
            raise ValueError("No text found in image")

        # Chunk every 500 chars
        chunks = [text[i:i+500] for i in range(0, len(text), 500)]
        preview = text[:150] + "..." if len(text) > 150 else text

        return chunks, preview

    except Exception as e:
        log.error("ocr_failed", error=str(e))
        raise ValueError(f"OCR failed: {e}")