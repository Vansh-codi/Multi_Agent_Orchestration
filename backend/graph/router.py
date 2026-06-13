# from typing import Literal


# def classify_goal(
#     goal: str,
#     context_files: list[str] | None = None,
# ) -> Literal[
#     "rag",
#     "coding",
#     "research",
#     "multi_agent",
# ]:

#     goal_lower = goal.lower()

#     # ---------------------------------------------------
#     # Simple RAG / file QA
#     # ---------------------------------------------------

#     simple_questions = [
#         "what is",
#         "find",
#         "search",
#         "tell me",
#         "summarize",
#         "explain",
#     ]
#     print("\n=========== ROUTER ===========")
#     print("GOAL:", goal)
#     print("FILES:", context_files)
#     print("================================\n")

#     if (
#         context_files
#         and any(
#             goal_lower.startswith(q)
#             for q in simple_questions
#         )
#         and len(goal.split()) < 15
#     ):
#         return "rag"

#     # ---------------------------------------------------
#     # Coding requests
#     # ---------------------------------------------------

#     coding_keywords = [
#         "build",
#         "code",
#         "python",
#         "javascript",
#         "react",
#         "fastapi",
#         "api",
#         "implement",
#     ]

#     if any(
#         word in goal_lower
#         for word in coding_keywords
#     ):
#         return "coding"

#     # ---------------------------------------------------
#     # Research-heavy tasks
#     # ---------------------------------------------------

#     research_keywords = [
#         "research",
#         "analyze",
#         "compare",
#         "investigate",
#         "study",
#     ]

#     if any(
#         word in goal_lower
#         for word in research_keywords
#     ):
#         return "research"

#     # ---------------------------------------------------
#     # Default
#     # ---------------------------------------------------

#     return "multi_agent"



# backend/graph/router.py
from typing import Literal


def classify_goal(
    goal: str,
    context_files: list[str] | None = None,
) -> Literal[
    "planner_only",
    "researcher_only",
    "coder_only",
    "critic_only",
    "rag",
    "coding",
    "research",
    "multi_agent",
]:
    goal_lower = goal.lower().strip()

    # ── Explicit slash commands ───────────────────────────────
    if goal_lower.startswith("/planner"):
        return "planner_only"

    if goal_lower.startswith("/researcher"):
        return "researcher_only"

    if goal_lower.startswith("/coder"):
        return "coder_only"

    if goal_lower.startswith("/critic"):
        return "critic_only"

    if goal_lower.startswith("/rag"):
        return "rag"

    # ── Simple RAG / file QA ──────────────────────────────────
    simple_questions = [
        "what is", "find", "search", "tell me",
        "summarize", "explain", "what does", "what was",
        "who is", "where is", "when did",
    ]
    if (
        context_files
        and any(goal_lower.startswith(q) for q in simple_questions)
        and len(goal.split()) < 15
    ):
        return "rag"

    # ── Coding requests ───────────────────────────────────────
    coding_keywords = [
        "build", "code", "python", "javascript", "react",
        "fastapi", "api", "implement", "write", "create",
        "develop", "program", "script", "function", "class",
        "algorithm", "sort", "parse", "generate",
    ]
    if any(word in goal_lower for word in coding_keywords):
        return "coding"

    # ── Research-heavy tasks ──────────────────────────────────
    research_keywords = [
        "research", "analyze", "compare", "investigate",
        "study", "survey", "review", "evaluate", "assess",
    ]
    if any(word in goal_lower for word in research_keywords):
        return "research"

    # ── Default: full orchestration ───────────────────────────
    return "multi_agent"