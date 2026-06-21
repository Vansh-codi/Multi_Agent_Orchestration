import asyncio
import sys
import traceback
import uuid
import json
import jwt
import structlog
from graph.agents.github_agent import GitHubAgent
from services.preferences import get_user_preferences
from services.cache import (
    get_cached_run,
    save_cached_run,
)
from tools.github_auth import get_github_token
from fastapi import Depends
from routes.dependencies import get_current_user
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
)
from routes.memory import router as memory_router
from routes.orion import router as orion_router

from fastapi import HTTPException
from routes.auth import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from routes.admin import router as admin_router
from routes.uploads import router as uploads_router
from graph.router import classify_goal
from graph.rag_flow import run_rag_flow
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from slowapi import Limiter
from fastapi import Request
from services.activity import log_activity
from graph.agents.planner import planner_node
from graph.agents.researcher import researcher_node
from graph.agents.coder import coder_node
from graph.agents.critic import critic_node
from routes.plan import router as plan_router
from routes.apikeys import router as apikeys_router
from routes.github import router as github_router
from routes.system import router as system_router
from config import get_settings
from starlette.middleware.sessions import SessionMiddleware
from routes.preferences import router as preferences_router
from routes.assistant import router as assistant_router

settings = get_settings()
from services.suggestion import (
    add_suggestions,
)
from services.db import (
    init_db,
    get_db,
)
from routes.tools import router as tools_router



SECRET_KEY = settings.jwt_secret
ALGORITHM = "HS256"
# ---------------------------------------------------
# Windows asyncio fix
# ---------------------------------------------------

if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsProactorEventLoopPolicy()
    )

# ---------------------------------------------------
# Local imports
# ---------------------------------------------------



from graph.build_graph import GRAPH
from graph.state import AgentState

from bus.redis_bus import (
    publish_event,
    subscribe_events,
)
from routes.updates import router as updates_router
from routes.auth import router as auth_router
from routes.generated_files import (
    router as generated_files_router
)

# ---------------------------------------------------
# Setup
# ---------------------------------------------------

log = structlog.get_logger()



# ---------------------------------------------------
# FastAPI app
# ---------------------------------------------------

app = FastAPI(
    title="AgentOps API",
    version="1.0.0",
)
@app.on_event("startup")
async def startup():

    await init_db()

    log.info("database_pool_initialized")

# ---------------------------------------------------
# Register routers
# ---------------------------------------------------
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(uploads_router)
app.include_router(generated_files_router)
app.include_router(system_router)
app.include_router(plan_router)
app.include_router(apikeys_router)
app.include_router(assistant_router)
app.include_router(github_router)
app.include_router(updates_router)
app.include_router(preferences_router)
app.include_router(orion_router)
app.include_router(memory_router)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret)
app.include_router(tools_router)
if settings.environment != "production":
  print("REGISTERED ROUTES:")
  for route in app.routes:
    print(route.path)
    
# ---------------------------------------------------
# CORS
# ---------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=settings.cors_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)
# ---------------------------------------------------
# Health endpoint
# ---------------------------------------------------


@app.get("/health")

async def health():

    return {
        "status": "ok",
        "env": settings.environment,
    }

# ---------------------------------------------------
# Start agent run
# ---------------------------------------------------
# ---------------------------------------------------
# Start agent run
@app.post("/run")
@limiter.limit("10/minute")
async def run_agent(
    request: Request,
    payload: dict,
    user=Depends(get_current_user),
) -> dict:

    run_id = str(uuid.uuid4())

    goal = payload["goal"]
    
    

# ----------------------------------
# GITHUB COMMANDS
# ----------------------------------

    if goal.startswith("/git"):

        token = await get_github_token(
            user["id"]
        )

      

        if not token:
          return {
        "success": False,
        "message": "No GitHub token saved"
    }
        agent = GitHubAgent(token)

        command = goal[1:]
        log.info(
    "github_command",
    command=command,
    user=user["email"],
)


        result = agent.run(
    command
)


        # ----------------------------------
        # FORMAT OUTPUT
        # ----------------------------------

        if command == "git/list repos":

            formatted = "\n".join(
                [
                    f"📦 {repo['name']} {'🔒' if repo.get('private') else '🌍'}"
                    for repo in result
                ]
            )

        elif command.startswith("git/list issues"):

            formatted = "\n".join(
                [
                    f"#{issue['number']} [{issue['state']}] {issue['title']}"
                    for issue in result
                ]
            )

        elif command.startswith("git/list branches"):

            formatted = "\n".join(
                [
                    f"🌿 {branch['name']}"
                    for branch in result
                ]
            )

        elif isinstance(result, dict):
            if result.get("success") is False:

                formatted = (
                    f"❌ Error\n\n"
                    f"{result['message']}"
                )

            elif result.get("repo"):

                formatted = (
                    f"✅ Repository Created\n\n"
                    f"Repo: {result['repo']}\n"
                    f"URL: {result['url']}"
                )

            elif result.get("issue_number"):

                formatted = (
                    f"✅ Issue Created\n\n"
                    f"#{result['issue_number']} "
                    f"{result['title']}\n"
                    f"{result['url']}"
                )

            elif result.get("branch"):

                formatted = (
                    f"✅ Branch Created\n\n"
                    f"{result['branch']}"
                )

            elif result.get("path"):

                action = result.get(
                    "action",
                    "created"
                )

                if action == "updated":

                    formatted = (
                        f"✅ File Updated\n\n"
                        f"{result['path']}"
                    )
                elif action == "deleted":

                    formatted = (
                        f"🗑️ File Deleted\n\n"
                        f"{result['path']}"
                    )

                else:

                    formatted = (
                        f"✅ File Created\n\n"
                        f"{result['path']}"
                    )

            else:

                formatted = str(result)

        else:

            formatted = str(result)

        return {
            "run_id": run_id,
            "github": True,
            "result": formatted,
        }

    pool = await get_db()
    if not pool:
       raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    

    async with pool.acquire() as conn:

        run_row = await conn.fetchrow(
            """
            INSERT INTO agent_runs (
                user_id,
                goal,
                status,
                tokens_used
            )
            VALUES ($1,$2,'running',0)
            RETURNING id
            """,
            user["id"],
            goal,
        )
        db_run_id = run_row["id"]
    context_files = payload.get(
        "context_files",
        [],
    )
    print(
    "CONTEXT FILES RECEIVED:",
    context_files
)

    route = classify_goal(
        goal=goal,
        context_files=context_files,
    )
    prefs = await get_user_preferences(
    str(user["id"])
)

    if  (
    prefs["smart_cache"]
    and not context_files
):

        cached = await get_cached_run(
            str(user["id"]),
            route,
            goal,
        )
        if cached:

            print("CACHE HIT")

            cache_data = json.loads(
                cached["result"]
            )

            async def send_cached():

                await asyncio.sleep(1)

                await publish_event(
                    run_id,
                    {
                        "node": "researcher",
                        "messages": [
                            cache_data["message"]
                        ],
                        "approved": True,
                        
                    },
                )
                await publish_event(
    run_id,
    {
        "type": "done",
    },
)

            asyncio.create_task(
                send_cached()
            )

            return {
                "run_id": run_id,
                "route": route,
                "cached": True,
            }
        print("CACHE MISS")



    log.info(
        "route_selected",
        route=route,
        goal=goal,
        user=user["email"],
    )
    # ---------------------------------------------------
# PLANNER ONLY
# ---------------------------------------------------

    if route == "planner_only":

        async def run_planner():

            try:

                clean_goal = goal.replace(
                    "/planner",
                    "",
                ).strip()
                await log_activity(
                    "run",
                    "Planner started",
                    clean_goal,
                )

                result = await planner_node({
                    "user_id": user["id"],
                    "goal":          clean_goal,
                    "plan":          [],
                    "messages":      [],
                    "results":       {},
                    "next":          "planner",
                    "approved":      False,
                    "error":         None,
                    "context_files": context_files,
                })

                msg = ""

                if result.get("messages"):

                    first = result["messages"][0]

                    msg = (
                        first.content
                        if hasattr(first, "content")
                        else str(first)
                    )

                await publish_event(
                    run_id,
                    {
                        "node": "planner",

                        "messages": [
                            msg
                            if msg
                            else (
                                f"Plan created: "
                                f"{len(result.get('plan', []))} tasks"
                            )
                        ],

                        "plan": result.get("plan", []),

                        "approved": True,
                         
                    },
                )
                await publish_event(
    run_id,
    {
        "type": "done",
    },
)
                await log_activity(
    "run",
    "Planner completed",
    clean_goal,
)

            except Exception as e:
                await log_activity(
    "run",
    "Planner failed",
    str(e),
)

                await publish_event(
                    run_id,
                    {
                        "node": "planner",
                        "messages": [],
                        "error": str(e),
                    },
                )

        asyncio.create_task(
            run_planner()
        )
    # ---------------------------------------------------
    # RESEARCHER ONLY
    # ---------------------------------------------------

    elif route == "researcher_only":

        async def run_researcher():

            try:

                clean_goal = goal.replace(
                    "/researcher",
                    "",
                ).strip()

                result = await researcher_node({
                    "user_id": user["id"],
                    "goal": clean_goal,
                    "context_files": context_files,
                    "plan": [
                        {
                            "id": "t1",
                            "task": clean_goal,
                            "assigned_to": "researcher",
                            "depends_on": [],
                        }
                    ],
                    "results": {},
                    "messages": [],
                    "next": "researcher",
                    "approved": False,
                    "error": None,
                })

                msg = ""

                if result.get("messages"):

                    first = result["messages"][0]

                    msg = (
                        first.content
                        if hasattr(first, "content")
                        else str(first)
                    )
                    msg = await add_suggestions(
                        str(user["id"]),
                        msg,
                    )

                if  (
                    prefs["smart_cache"]
                    and not context_files
                ):

                    await save_cached_run(
                        str(user["id"]),
                        route,
                        goal,
                        {
                            "message": msg
                        }
                    )

                    print("CACHE SAVED")

                await publish_event(
                    run_id,
                    {
                        "node": "researcher",
                        "messages": [msg],
                        "approved": True,
                        
                    },
                )
                await publish_event(
    run_id,
    {
        "type": "done",
    },
)

            except Exception as e:

                print("RESEARCHER ERROR =", str(e))

                await publish_event(
                    run_id,
                    {
                        "node": "researcher",
                        "messages": [],
                        "error": str(e),
                    },
                )

        asyncio.create_task(
            run_researcher()
        )

    # ---------------------------------------------------
    # CODER ONLY
    # ---------------------------------------------------

    elif route == "coder_only":

        async def run_coder():
            try:
                clean_goal = goal.replace(
                    "/coder",
                    "",
                ).strip()

                result = await coder_node({
                    "goal":          clean_goal,

                    "context_files": context_files,

                    "plan": [
                        {
                            "id": "t1",
                            "task": clean_goal,
                            "assigned_to": "coder",
                            "depends_on": [],
                        }
                    ],

                    "results":       {},
                    "messages":      [],
                    "next":          "coder",
                    "approved":      False,
                    "error":         None,
                    "user_id":       str(user["id"]),
                })

                msg = ""

                if result.get("messages"):

                    first = result["messages"][0]

                    msg = (
                        first.content
                        if hasattr(first, "content")
                        else str(first)
                    )
                    

                await publish_event(
                    run_id,
                    {
                        "node": "coder",
                        "messages": [msg],
                        "approved": True,
                        
                    },
                )
                await publish_event(
    run_id,
    {
        "type": "done",
    },
)

            except Exception as e:

                await publish_event(
                    run_id,
                    {
                        "node": "coder",
                        "messages": [],
                        "error": str(e),
                    },
                )

        asyncio.create_task(
            run_coder()
        )

    # ---------------------------------------------------
    # CRITIC ONLY
    # ---------------------------------------------------

    elif route == "critic_only":

        async def run_critic():

            try:

                clean_goal = goal.replace(
                    "/critic",
                    "",
                ).strip()

                result = await critic_node({
                    "goal":          clean_goal,
                    "context_files": context_files,
                    "results":       {},
                    "messages":      [],
                    "plan":          [],
                    "next":          "critic",
                    "approved":      False,
                    "error":         None,
                })

                msg = ""

                if result.get("messages"):

                    first = result["messages"][0]

                    msg = (
                        first.content
                        if hasattr(first, "content")
                        else str(first)
                    )

                await publish_event(
                    run_id,
                    {
                        "node": "critic",
                        "messages": [msg],
                        "approved": True,
                         
                    },
                )
                await publish_event(
    run_id,
    {
        "type": "done",
    },
)

            except Exception as e:

                await publish_event(
                    run_id,
                    {
                        "node": "critic",
                        "messages": [],
                        "error": str(e),
                    },
                )

        asyncio.create_task(
            run_critic()
        )

    # ---------------------------------------------------
    # SIMPLE RAG MODE
    # ---------------------------------------------------

    elif route == "rag":

        async def run_simple_rag():
            try:

                result = await run_rag_flow(
                    goal=goal,
                    context_files=context_files,
                    user_id=str(user["id"]),
                )
                print("\n========== RAG RESULT ==========")
                print(result)
                print("================================")

                print("ANSWER:")
                print(result.get("answer"))

                print("CHUNKS:")
                print(len(result.get("chunks", [])))

                print("PUBLISHING TO:", run_id)
                print("PUBLISHING RESEARCHER EVENT")


                await publish_event(
                    run_id,
                    {
                        "node": "researcher",
                        "chunks": result["chunks"],
                        "messages": [result["answer"]],
                        "similarity": result["similarity"],
                        "distance": result["distance"],
                        "threshold": result["threshold"],
                        "sources": result["sources"],
                        "approved": result["approved"],
                    },
                )
                print("RESEARCHER EVENT PUBLISHED")

                status = (
                    "completed"
                    if result["approved"]
                    else "failed"
                )

                pool = await get_db()

                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        UPDATE agent_runs
                        SET status = $1
                        WHERE id = $2
                        """,
                        status,
                        db_run_id,
                    )
                print("PUBLISHING DONE EVENT")

                await publish_event(
                    run_id,
                    {
                        "type": "done",
                    },
                )
                print("DONE EVENT PUBLISHED")

            except Exception as e:

                pool = await get_db()

                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        UPDATE agent_runs
                        SET status = 'failed'
                        WHERE id = $1
                        """,
                        db_run_id,
                    )

                await publish_event(
                    run_id,
                    {
                        "node": "researcher",
                        "messages": [],
                        "error": str(e),
                    },
                )

        async def delayed_rag():
            print("WAITING 3 SECONDS FOR WS...")
            await asyncio.sleep(3)
            await run_simple_rag()

        asyncio.create_task(
            delayed_rag()
        )

        # asyncio.create_task(
        #     run_simple_rag()
        # )

# ---------------------------------------------------
    # FULL AGENT GRAPH
    # ---------------------------------------------------

    else:

        asyncio.create_task(
            _run_graph(
                run_id,
                db_run_id,
                goal,
                context_files,
                str(user["id"])
            )
        )

    # ---------------------------------------------------
    # Logging
    # ---------------------------------------------------

    log.info(
        "agent_run_started",
        run_id=run_id,
        goal=goal[:80],
        route=route,
        user=user["email"],
    )

    # ---------------------------------------------------
    # Response
    # ---------------------------------------------------

    return {
        "run_id": run_id,
        "route": route,
        "user": user["email"],
    }


# ---------------------------------------------------
# Graph execution
# ---------------------------------------------------

async def _run_graph(
    run_id: str,
    db_run_id: str,
    goal: str,
    context_files: list = [],
    user_id: str = "anonymous",  # ← added parameter
):

    initial_state: AgentState = {
        "goal":          goal,
        "messages":      [],
        "plan":          [],
        "results":       {},
        "next":          "planner",
        "approved":      False,
        "error":         None,
        "context_files": context_files,
        "user_id":       user_id, 
        "tokens_used":   0, # ← now works
    }

    try:
        final_tokens = 0
        final_messages = []
        async for event in GRAPH.astream_events(
            initial_state,
            version="v1",
        ):
            

            if (
                event.get("event") == "on_chain_end"
                and event.get("name") in [
                    "planner",
                    "researcher",
                    "coder",
                    "critic",
                    "supervisor",
                ]
            ):

                output = (
                    event.get("data", {})
                    .get("output", {})
                )
                if isinstance(output, dict):
                    final_tokens = max(
                        final_tokens,
                        output.get("tokens_used", 0)
                    )
                    
                if not isinstance(output, dict):
                    output = {"messages": [str(output)]}

                messages = []
                for m in output.get("messages", []):
                    if hasattr(m, "content"):
                        messages.append(m.content)
                    else:
                        messages.append(str(m))
                        
                if output.get("approved"):

                    messages = [
                        await add_suggestions(
                            user_id,
                            m,
                        )
                        for m in messages
                    ]
                    final_messages.extend(messages)

                await publish_event(
                    run_id,
                    {
                        "node":     event.get("name", ""),
                        "messages": messages,
                        "approved": output.get("approved"),
                    },
                )
        await publish_event(
            run_id,
            {
                "type": "done",
            },
        )
        print(
        "FINAL TOKENS:",
        final_tokens,
        "DB RUN:",
        db_run_id,
    )

        pool = await get_db()

        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE agent_runs
                SET
                    status = 'completed',
                    tokens_used = $1
                WHERE id = $2
                """,
                final_tokens,
                db_run_id,
            )
            summary = "\n".join(final_messages[:5])

            if summary.strip() and len(summary) > 50:

                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO assistant_memory
                        (
                            user_id,
                            topic,
                            summary,
                            category,
                            source
                        )
                        VALUES ($1,$2,$3,$4,$5)
                        """,
                        user_id,
                        goal[:100],
                        summary[:500],
                        "projects",
                        "AgentOps",
                    )

    except asyncio.CancelledError:          # ← added
        log.info("graph_cancelled", run_id=run_id)
        return

    except Exception:
        error_text = traceback.format_exc()
        log.error("graph_error", run_id=run_id, error=error_text)
        await publish_event(
            run_id,
            {
                "node":     "system",
                "messages": [],
                "error":    error_text,
            },
        )
## ---------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------
@app.middleware("http")
async def security_headers(request, call_next):

    response = await call_next(request)

    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response
@app.websocket("/ws/{run_id}")
async def websocket_endpoint(ws: WebSocket, run_id: str):
    token = ws.cookies.get("agentops_token")
    if not token:
        await ws.close(code=1008)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")
        if not jti:
            await ws.close(code=1008)
            return

        pool = await get_db()
        async with pool.acquire() as conn:
            session = await conn.fetchrow(
                """
                SELECT 1 FROM sessions
                WHERE token_jti = $1 AND revoked = FALSE AND expires_at > NOW()
                """,
                jti,
            )
        if not session:
            await ws.close(code=1008)
            return

    except jwt.InvalidTokenError:
        await ws.close(code=1008)
        return

    await ws.accept()

    try:

        async for event in subscribe_events(run_id):
            print("\nWS EVENT RECEIVED:")
            print(event)

            # Skip blank system events
            if (
                event.get("node") == "system"
                and not event.get("error")
                and not any(event.get("messages", []))
            ):
                continue
            print("\n========== WS EVENT ==========")
            print(event)
            print("==============================")
            print("WS SEND:", event)
            await ws.send_json(event)
            if event.get("type") == "done":
                break

            if event.get("error"):
                break

            # if (
            #     event.get("approved") is True
            #     or event.get("error")
            # ):
            #     break

    except WebSocketDisconnect:

        log.info(
            "ws_disconnected",
            run_id=run_id,
        )

    except Exception as e:

        log.error(
            "ws_error",
            run_id=run_id,
            error=str(e),
        )
    finally:
        if ws.client_state.name != "DISCONNECTED":
            try:
                await ws.close()
            except RuntimeError:
                pass

    # finally:

    #     await ws.close()

