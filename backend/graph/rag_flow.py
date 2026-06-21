#ragflow

from tools.rag_retriever import rag_tool
from services.preferences import get_user_preferences


async def run_rag_flow(
    goal: str,
    context_files: list[str],
    user_id: str,
):
    clean_goal = goal.replace("/rag", "").strip()

    prefs = await get_user_preferences(user_id)
    print(
    "RAG FLOW USER ID:",
    user_id
)

    result = rag_tool.invoke({
        "query": clean_goal,
        "context_files": context_files,
        "user_id": user_id,
        "threshold": prefs["rag_threshold"],
    })
    print("\n========== RAW RAG TOOL RESULT ==========")
    print(result)
    print("=========================================")
        
    if not result["chunks"]:
        print("RETURNING EMPTY RAG RESULT")
        return {
            "type": "rag_answer",
            "chunks": [],
            "answer": result["answer"],
            "distance": result["distance"],
            "similarity": 0,
            "threshold": result["threshold"],
            "sources": [],
            "approved": False,
        }
    print("RETURNING SUCCESSFUL RAG RESULT")

    return {
        "type": "rag_answer",
        "chunks": result["chunks"],
    "answer": result["answer"],
    "distance": result["distance"],
    "similarity": result["similarity"],
    "threshold": result["threshold"],
    "sources": result["sources"],
    "approved": True,
    }