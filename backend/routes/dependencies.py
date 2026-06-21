
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
    print("========== AUTH DEBUG ==========")
    print("COOKIE:", bool(agentops_token))
    print("AUTH:", authorization)
    token = agentops_token

    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
    print("TOKEN FOUND:", bool(token))

    if not token:
        print("401: NO TOKEN")
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
        print("JWT DECODE OK")
        print("SUB:", payload.get("sub"))
        print("JTI:", payload.get("jti"))


        jti = payload.get("jti")

        if not jti:
            print("401: NO JTI")
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
            print("SESSION FOUND:", bool(session))
          

            if not session:
                print("401: SESSION EXPIRED")
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
            print("USER FOUND:", bool(user))

            if not user:
                print("401: USER NOT FOUND")
                raise HTTPException(
                    status_code=401,
                    detail="User not found"
                )
            print("AUTH SUCCESS")


            return {
                "user_id": str(user["id"]),
                "id": str(user["id"]),
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            }

    except jwt.ExpiredSignatureError:
        print("401: TOKEN EXPIRED")
        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )

    except jwt.InvalidTokenError as e:
        print("401: INVALID TOKEN")
        print("ERROR:", str(e))
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
  