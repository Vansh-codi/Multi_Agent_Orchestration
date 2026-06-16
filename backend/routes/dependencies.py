
from fastapi import Cookie, HTTPException, status,Header
import jwt

from config import get_settings
from services.db import get_db

settings = get_settings()

SECRET_KEY = settings.jwt_secret
ALGORITHM = "HS256"


async def get_current_user(
    agentops_token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
):
    token = agentops_token

    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:

        payload = jwt.decode(
            token,
            # agentops_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        jti = payload.get("jti")

        if not jti:
            raise HTTPException(
                status_code=401,
                detail="Invalid session"
            )

        pool = await get_db()

        async with pool.acquire() as conn:

            # Session validation
            session = await conn.fetchrow(
                """
                SELECT *
                FROM sessions
                WHERE token_jti = $1
                AND revoked = FALSE
                AND expires_at > NOW()
                """,
                jti,
            )

            if not session:
                raise HTTPException(
                    status_code=401,
                    detail="Session expired"
                )

            # Load fresh user data
            user = await conn.fetchrow(
                """
                SELECT
                    id,
                    name,
                    email,
                    role
                FROM users
                WHERE id = $1
                """,
                payload["sub"],
            )

            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="User not found"
                )

            return {
                "user_id": str(user["id"]),
                "id": str(user["id"]),
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    print("COOKIE:", agentops_token)
    print("AUTH:", authorization)
    print("TOKEN:", token)