# backend/routes/auth.py
# from datetime import datetime, timedelta
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from typing import Optional
import uuid
import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
import asyncpg
from fastapi import Response
from config import get_settings
from routes.dependencies import get_current_user
import re
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)
from fastapi import Request
from services.activity import log_activity
from services.db import get_db
router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
SECRET_KEY  = settings.jwt_secret # use dedicated SECRET in prod
ALGORITHM   = "HS256"
TOKEN_MINUTES = 60 * 24

# ── Schemas ───────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class UpdateProfileRequest(BaseModel):
    name: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user: dict

# ── Helpers ───────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
def validate_password(password: str):

    if len(password) < 8:
        raise HTTPException(400, "Password too short")

    if not re.search(r"[A-Z]", password):
        raise HTTPException(400, "Must contain uppercase")

    if not re.search(r"[a-z]", password):
        raise HTTPException(400, "Must contain lowercase")

    if not re.search(r"\d", password):
        raise HTTPException(400, "Must contain number")

def create_token(user_id: str, email: str, jti: str,) -> str:
    payload = {
        "sub":   user_id,
        "email": email,
        "jti": jti,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# async def get_db():
#     return await asyncpg.connect(settings.database_url,
#         ssl="require")

# ── Create users table if not exists ─────────────────────────
async def ensure_users_table():
    # conn = await get_db()
    pool = await get_db()
    
    async with pool.acquire() as conn:
         await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name      TEXT NOT NULL,
                email     TEXT UNIQUE NOT NULL,
                password  TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
         

# ── OAuth: find or create user, issue token + session ────────
async def get_or_create_oauth_user(email: str, name: str) -> tuple[dict, str]:
    await ensure_users_table()
    pool = await get_db()

    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, name, email, role FROM users WHERE email = $1",
            email,
        )

        if not user:
            random_pw = hash_password(str(uuid.uuid4()))
            user = await conn.fetchrow(
                """
                INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, name, email, role
                """,
                name or email.split("@")[0],
                email,
                random_pw,
            )
            await log_activity("user", "New user registered (Google)", email)

        jti = str(uuid.uuid4())
        token = create_token(str(user["id"]), user["email"], jti)

        await conn.execute(
             """
            INSERT INTO sessions (user_id, token_jti, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '24 hours')
            """,
            user["id"],
            jti,
        )

    return dict(user), token

# ── Routes ────────────────────────────────────────────────────
from fastapi import Response

@router.post("/signup", response_model=AuthResponse)
@limiter.limit("3/minute")
async def signup(
    request: Request,
    body: SignupRequest,
    response: Response
):
    await ensure_users_table()

    # conn = await get_db()
    pool = await get_db()

    async with pool.acquire() as conn:

            existing = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1",
                body.email,
            )

            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered",
                )

            validate_password(body.password)

            hashed = hash_password(body.password)

            user = await conn.fetchrow(
                """
                INSERT INTO users (name,email,password)
                VALUES ($1,$2,$3)
                RETURNING id,name,email,role
                """,
                body.name,
                body.email,
                hashed,
            )
            await log_activity(
                "user",
                "New user registered",
                user["email"],
            )
            jti = str(uuid.uuid4())
            token = create_token(
            str(user["id"]),
            user["email"],
             jti,
            )
            await conn.execute(
            """
            INSERT INTO sessions (
                user_id,
                token_jti,
                expires_at
            )
            VALUES (
                $1,
                $2,
                NOW() + INTERVAL '24 hours'
            )
            """,
            user["id"],
            jti,
            )

        # Secure auth cookie
    response.set_cookie(
            key="agentops_token",
            value=token,
            httponly=True,
            secure=settings.cookie_secure, # True in production
            samesite="none" if settings.cookie_secure else "lax",
            max_age=60 * 60,
        )

    return AuthResponse(
            access_token=token,
            user={
                "id": str(user["id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            }
        )

@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response
):
    await ensure_users_table()

    # conn = await get_db()
    pool = await get_db()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, name, email, password,role FROM users WHERE email = $1",
            body.email
        )

        if not user or not verify_password(
            body.password,
            user["password"]
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        jti = str(uuid.uuid4())
        token = create_token(
            str(user["id"]),
            user["email"],
            jti,
        )
        await conn.execute(
    """
    INSERT INTO sessions (
        user_id,
        token_jti,
        expires_at
    )
    VALUES (
        $1,
        $2,
        NOW() + INTERVAL '24 hours'
    )
    """,
    user["id"],
    jti,
)

        # Secure auth cookie
        response.set_cookie(
            key="agentops_token",
            value=token,
            httponly=True,
            secure= settings.cookie_secure, # True in production
            # samesite="lax",
            samesite="none" if settings.cookie_secure else "lax",
            max_age=60 * 60,
        )

        return AuthResponse(
            access_token=token,
            user={
                "id": str(user["id"]),
                "name": user["name"],
                "email": user["email"],
                 "role": user["role"]
            }
        )
@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = f"{settings.backend_url}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")

    if not userinfo or not userinfo.get("email_verified"):
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=google_auth_failed"
        )

    email = userinfo["email"]
    name = userinfo.get("name", "")

    user, access_token = await get_or_create_oauth_user(email, name)
    print("========== GOOGLE CALLBACK ==========")
    print("EMAIL:", email)
    print("USER ID:", user["id"])
    print("TOKEN CREATED:", bool(access_token))
    print("FRONTEND URL:", settings.frontend_url)

    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard")
    response.set_cookie(
        key="agentops_token",
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        # samesite="lax",
        samesite="none" if settings.cookie_secure else "lax",
        max_age=60 * 60 * 24,
    )
    print("COOKIE SET")
    return response
# @router.get("/me")
# async def me(token: str):
#     """Verify token and return user info."""
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         return {"user_id": payload["sub"], "email": payload["email"]}
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid token")
@router.get("/me")
async def me(
    user=Depends(get_current_user)
):
    print("========== /ME ==========")
    print("USER:", user)
    return user
from fastapi import Cookie

@router.post("/logout")
async def logout(
    response: Response,
    agentops_token: str | None = Cookie(default=None)
):

    if agentops_token:

        try:
            payload = jwt.decode(
                agentops_token,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )

            jti = payload.get("jti")

            if jti:

                pool = await get_db()

                async with pool.acquire() as conn:

                    await conn.execute(
                        """
                        UPDATE sessions
                        SET revoked = TRUE
                        WHERE token_jti = $1
                        """,
                        jti,
                    )

        except jwt.InvalidTokenError:
            pass

    response.delete_cookie(
        key="agentops_token",
        httponly=True,
        samesite="none" if settings.cookie_secure else "lax",
    )

    return {
        "success": True
    }


# from fastapi import Cookie

# @router.post("/logout")
# async def logout(
#     response: Response,
#     agentops_token: str | None = Cookie(default=None)
#     ):
    
#     return {"success": True}

    # response.delete_cookie(
    #     key="agentops_token",
    #     httponly=True,
    #     samesite="lax",
    # )

@router.patch("/profile")
async def update_profile(
    body: UpdateProfileRequest,
    user=Depends(get_current_user)
):
  
    pool = await get_db()

    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE users
            SET name = $1
            WHERE id = $2
            """,
            body.name,
            user["user_id"],
        )

        return {
            "success": True,
            "name": body.name,
        }

@router.patch("/password")
async def change_password(
    body: ChangePasswordRequest,
    user=Depends(get_current_user)
):

    # 
   pool = await get_db()
   async with pool.acquire() as conn:

        db_user = await conn.fetchrow(
            """
            SELECT password
            FROM users
            WHERE id = $1
            """,
            user["user_id"],
        )

        if not db_user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        if not verify_password(
            body.current_password,
            db_user["password"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Current password incorrect"
            )

        validate_password(body.new_password)

        new_hash = hash_password(
            body.new_password
        )

        await conn.execute(
            """
            UPDATE users
            SET password = $1
            WHERE id = $2
            """,
            new_hash,
            user["user_id"],
        )

        return {"success": True}
@router.delete("/account")
async def delete_account(
    response: Response,
    user=Depends(get_current_user)
):
    pool = await get_db()

    async with pool.acquire() as conn:

        # Revoke all active sessions
        await conn.execute(
            """
            UPDATE sessions
            SET revoked = TRUE
            WHERE user_id = $1
            """,
            user["user_id"],
        )

        # Delete user
        await conn.execute(
            """
            DELETE FROM users
            WHERE id = $1
            """,
            user["user_id"],
        )

    response.delete_cookie(
        key="agentops_token",
        httponly=True,
        # samesite="lax",
        samesite="none" if settings.cookie_secure else "lax",
    )

    return {
        "success": True
    }



  