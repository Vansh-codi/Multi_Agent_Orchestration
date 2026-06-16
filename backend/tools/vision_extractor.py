# backend/tools/vision_extractor.py
# Screenshot NEVER sent to cloud — processed by local Ollama only

import httpx
import base64
import re
import io
from typing import Optional


# ── Sensitive data redaction ──────────────────────────────────────────────────

REDACT_PATTERNS = [
    (r'sk-[a-zA-Z0-9]{20,}',               '[API_KEY]'),
    (r'gsk_[a-zA-Z0-9]{20,}',              '[GROQ_KEY]'),
    (r'sk-ant-[a-zA-Z0-9]{20,}',           '[ANTHROPIC_KEY]'),
    (r'ghp_[a-zA-Z0-9]{20,}',              '[GITHUB_TOKEN]'),
    (r'password[=:\s]+\S+',                 '[PASSWORD]'),
    (r'passwd[=:\s]+\S+',                   '[PASSWORD]'),
    (r'secret[=:\s]+\S+',                   '[SECRET]'),
    (r'Bearer\s+[a-zA-Z0-9\-._]{20,}',     'Bearer [TOKEN]'),
    (r'\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b', '[CARD]'),
    (r'[A-Z_]{3,}=["\']\S{8,}["\']',       '[ENV_VAR]'),
]


def redact_sensitive(text: str) -> str:
    for pattern, replacement in REDACT_PATTERNS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


# ── Core extractor — local Ollama LLaVA ──────────────────────────────────────

async def extract_screen_context(
    screenshot_b64: str,
    user_question: str = "",
    ollama_url: str = "http://localhost:11434",
    model: str = "moondream",
) -> str:
    prompt = f"Read all text visible in this image exactly as written. {user_question}"
    
    try:
        print("\n========== SCREENSHOT DEBUG ==========")
        print("Question:", user_question)
        print("Base64 length:", len(screenshot_b64))
        print("CALLING OLLAMA...")
        print("======================================\n")
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "images": [screenshot_b64],
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 4096,
                    },
                },
            )
            print("OLLAMA STATUS:", res.status_code)
            print("OLLAMA RESPONSE:", res.text[:500])

        if res.status_code != 200:
            return "[Vision extraction failed — please paste your problem/code directly]"

        raw = res.json().get("response", "")
        print("\n========== RAW LLAVA OUTPUT ==========")
        print(raw)
        print("======================================\n")
        return redact_sensitive(raw)

    except httpx.ConnectError:
        return "[Local Ollama not running — start it with: ollama serve | Or paste your content directly]"

    except Exception as e:
        return f"[Extraction error: {e}]"


# ── Screenshot capture ────────────────────────────────────────────────────────

def capture_screen_b64(monitor_index: int = 1) -> Optional[str]:
    """
    Captures screen, returns base64 PNG.
    Resizes to max 1024px wide for LLaVA performance.
    """
    try:
        import mss
        from PIL import Image

        with mss.mss() as sct:
            print("ALL MONITORS:", sct.monitors)
            print("CAPTURING MONITOR INDEX:", monitor_index)
            monitor = sct.monitors[monitor_index]
            print("MONITOR DETAILS:", monitor)
            img = sct.grab(monitor)
            print("CAPTURED SIZE:", img.size)

            pil_img = Image.frombytes(
                "RGB", img.size, img.bgra, "raw", "BGRX"
            )
         

            # Resize if too wide
            # if pil_img.width > 1024:
            #     ratio = 1024 / pil_img.width
            #     pil_img = pil_img.resize(
            #         (1024, int(pil_img.height * ratio)),
            #         Image.LANCZOS,
            #     )

            buf = io.BytesIO()
            pil_img.save(buf, format="PNG", optimize=True)
            return base64.b64encode(buf.getvalue()).decode()

    except ImportError:
        raise RuntimeError("pip install mss Pillow")
    except Exception as e:
        raise RuntimeError(f"Screen capture failed: {e}")