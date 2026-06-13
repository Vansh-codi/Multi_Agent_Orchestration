from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.activity import log_activity
from routes.dependencies import get_current_user
from tools.github_auth import get_github_token
from graph.agents.github_agent import GitHubAgent

router = APIRouter(
    prefix="/github",
    tags=["github"],
)


class GitCommandRequest(BaseModel):
    command: str


@router.get("/repos")
async def repos(
    user=Depends(get_current_user)
):

    token = await get_github_token(
        user["id"]
    )

    if not token:
        return {
            "success": False,
            "message": "No GitHub token saved"
        }

    agent = GitHubAgent(token)

    return agent.list_repos()


@router.post("/run")
async def run_git_command(
    payload: GitCommandRequest,
    user=Depends(get_current_user)
):

    token = await get_github_token(
        user["id"]
    )

    if not token:
        return {
            "success": False,
            "message": "No GitHub token saved"
        }

    agent = GitHubAgent(token)

    return agent.run(
        payload.command
    )
  