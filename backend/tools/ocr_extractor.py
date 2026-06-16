# import base64
# import io

# from PIL import Image
# from rapidocr_onnxruntime import RapidOCR

# ocr = RapidOCR()

# async def extract_text_from_image(
#     screenshot_b64: str,
# ) -> str:

#     image_bytes = base64.b64decode(
#         screenshot_b64
#     )

#     image = Image.open(
#         io.BytesIO(image_bytes)
#     )

#     result, _ = ocr(image)

#     if not result:
#         return ""

#     text = "\n".join(
#         item[1]
#         for item in result
#     )

#     print("\n========== OCR RESULT ==========")
#     print(text[:3000])
#     print("================================\n")

#     return text

import base64
import io
import re

from PIL import Image
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()

# Common VS Code / UI noise
NOISE_PATTERNS = [
    r"^File$",
    r"^Edit$",
    r"^Selection$",
    r"^View$",
    r"^Go$",
    r"^Run$",
    r"^Terminal$",
    r"^Help$",
    r"^BLACKBOX$",
    r"^Open Website$",
    r"^Generate Commit Message$",
    r"^PROBLEMS$",
    r"^DEBUG CONSOLE$",
    r"^TERMINAL$",
    r"^PORTS$",
    r"^\d+:\d+\s?(AM|PM)$",
]

MAX_CONTEXT_CHARS = 12000


def clean_ocr_text(text: str) -> str:
    lines = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        skip = False

        for pattern in NOISE_PATTERNS:
            if re.match(pattern, line, re.IGNORECASE):
                skip = True
                break

        if not skip:
            lines.append(line)

    cleaned = "\n".join(lines)

    # remove excessive blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

    return cleaned


async def extract_text_from_image(
    screenshot_b64: str,
) -> str:

    image_bytes = base64.b64decode(
        screenshot_b64
    )

    image = Image.open(
        io.BytesIO(image_bytes)
    )

    result, _ = ocr(image)

    if not result:
        return ""

    text = "\n".join(
        item[1]
        for item in result
    )

    text = clean_ocr_text(text)

    if len(text) > MAX_CONTEXT_CHARS:
        text = text[:MAX_CONTEXT_CHARS]

    print("\n========== OCR RESULT ==========")
    print(text[:3000])
    print("================================\n")

    return text