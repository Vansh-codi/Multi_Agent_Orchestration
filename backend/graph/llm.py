# # graphllmpy
# from langchain_groq import ChatGroq

# from config import get_settings
# from services.db import get_db

# settings = get_settings()


# async def get_llm(user_id: str) -> ChatGroq:

    
#     pool = await get_db()

#     if pool is None:
#         raise RuntimeError(
#             "Database pool not initialized"
#         )

#     async with pool.acquire() as conn:

#         row = await conn.fetchrow(
#             """
#             SELECT
#                 k.groq_key,
#                 COALESCE(
#                     p.model,
#                     'llama-3.3-70b-versatile'
#                 ) AS model
#             FROM users u
#             LEFT JOIN user_api_keys k
#                 ON k.user_id = u.id
#             LEFT JOIN user_preferences p
#                 ON p.user_id = u.id
#             WHERE u.id = $1
#             """,
#             user_id,
#         )

#         user_key = None
#         model = "llama-3.3-70b-versatile"

#         if row:
#             user_key = row["groq_key"]
#             model = row["model"]

#         api_key = (
#             user_key
#             if user_key
#             else settings.groq_api_key
#         )

#         print("MODEL =", model)
#         print("USING USER KEY =", bool(user_key))

#         return ChatGroq(
#             model=model,
#             temperature=0,
#             api_key=api_key,
#         )

# backend/graph/llm.py

from langchain_groq import ChatGroq
from config import get_settings
from services.db import get_db

settings = get_settings()


# ── Existing function — UNCHANGED, all agents use this ────────────────────────

async def get_llm(user_id: str) -> ChatGroq:
    pool = await get_db()

    if pool is None:
        raise RuntimeError("Database pool not initialized")

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                k.groq_key,
                COALESCE(p.model, 'llama-3.3-70b-versatile') AS model
            FROM users u
            LEFT JOIN user_api_keys k ON k.user_id = u.id
            LEFT JOIN user_preferences p ON p.user_id = u.id
            WHERE u.id = $1
            """,
            user_id,
        )

        user_key = None
        model = "llama-3.3-70b-versatile"

        if row:
            user_key = row["groq_key"]
            model = row["model"]

        api_key = user_key if user_key else settings.groq_api_key

        print("MODEL =", model)
        print("USING USER KEY =", bool(user_key))

        return ChatGroq(model=model, temperature=0, api_key=api_key)


# ── Provider functions — used only by Orion waterfall ────────────────────────

async def _call_cerebras(messages: list[dict], system: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://api.inference.cerebras.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.cerebras_api_key}"},
            json={
                "model": "llama3.3-70b",
                "messages": [
                    {"role": "system", "content": system},
                    *messages,
                ],
                "max_tokens": 2048,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


async def _call_gemini(messages: list[dict], system: str) -> str:
    import httpx
    # Gemini uses a different message format
    history = []
    for m in messages[:-1]:
        history.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [{"text": m["content"]}],
        })
    last = messages[-1]["content"] if messages else ""

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-flash:generateContent?key={settings.gemini_api_key}",
            json={
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [
                    *history,
                    {"role": "user", "parts": [{"text": last}]},
                ],
                "generationConfig": {"maxOutputTokens": 2048},
            },
        )
        res.raise_for_status()
        return (
            res.json()["candidates"][0]["content"]["parts"][0]["text"]
        )


async def _call_sambanova(messages: list[dict], system: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://api.sambanova.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.sambanova_api_key}"},
            json={
                "model": "Meta-Llama-3.3-70B-Instruct",
                "messages": [
                    {"role": "system", "content": system},
                    *messages,
                ],
                "max_tokens": 2048,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


async def _call_together(messages: list[dict], system: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://api.together.xyz/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.together_api_key}"},
            json={
                "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                "messages": [
                    {"role": "system", "content": system},
                    *messages,
                ],
                "max_tokens": 2048,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


async def _call_huggingface(messages: list[dict], system: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://api-inference.huggingface.co/models/"
            "meta-llama/Llama-3.1-8B-Instruct/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.huggingface_api_key}"},
            json={
                "model": "meta-llama/Llama-3.1-8B-Instruct",
                "messages": [
                    {"role": "system", "content": system},
                    *messages,
                ],
                "max_tokens": 2048,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


async def _call_ollama(messages: list[dict], system: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3.3",   # or whatever model you have pulled
                "messages": [
                    {"role": "system", "content": system},
                    *messages,
                ],
                "stream": False,
            },
        )
        res.raise_for_status()
        return res.json()["message"]["content"]


# ── Waterfall — Orion only, agents never call this ───────────────────────────

_PROVIDERS = [
    ("cerebras",    _call_cerebras),
    ("gemini",      _call_gemini),
    ("sambanova",   _call_sambanova),
    ("together",    _call_together),
    ("huggingface", _call_huggingface),
    ("ollama",      _call_ollama),     # local, always available
]


async def call_llm_with_fallback(
    messages: list[dict],
    system: str,
    skip_groq: bool = False,
) -> tuple[str, str]:
    """
    Try Groq first (unless skip_groq=True), then fall through the waterfall.
    Returns (response_text, provider_name_used).

    Only Orion's assistant.py calls this.
    Existing agents keep calling get_llm() — nothing changes for them.
    """

    # ── Try Groq first ────────────────────────────────────────────────────────
    if not skip_groq and settings.groq_api_key:
        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.groq_api_key)
            res = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system},
                    *messages,
                ],
                max_tokens=2048,
            )
            return res.choices[0].message.content, "groq"
        except Exception as e:
            print(f"[llm] Groq failed: {e} — trying waterfall")

    # ── Waterfall through other providers ─────────────────────────────────────
    for name, fn in _PROVIDERS:
        # Skip providers with no API key configured
        key_attr = f"{name}_api_key"
        if name != "ollama" and not getattr(settings, key_attr, ""):
            print(f"[llm] {name}: no key configured, skipping")
            continue

        try:
            print(f"[llm] Trying {name}...")
            result = await fn(messages, system)
            print(f"[llm] {name} succeeded")
            return result, name
        except Exception as e:
            print(f"[llm] {name} failed: {e}")
            continue

    raise RuntimeError(
        "All providers exhausted — no response available. "
        "Check your API keys or start Ollama locally."
    )