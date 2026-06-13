import asyncpg
from config import get_settings

import structlog
from langchain_core.messages import (
    AIMessage,
    SystemMessage,
    HumanMessage,
)

from graph.llm import get_llm
from graph.state import AgentState
from tools.web_search import web_search_tool
from tools.rag_retriever import rag_tool
from services.preferences import get_user_preferences
log = structlog.get_logger()

settings = get_settings()


async def get_serpapi_key(user_id: str):

    conn = await asyncpg.connect(
        settings.database_url,
        ssl="require",
    )

    try:

        row = await conn.fetchrow(
            """
            SELECT serpapi_key
            FROM user_api_keys
            WHERE user_id = $1
            """,
            user_id,
        )

        if row and row["serpapi_key"]:
            print(
    "USING USER SERP KEY =",
    bool(row and row["serpapi_key"])
)
            return row["serpapi_key"]
        print(
    "USING USER SERP KEY = False"
)

        return settings.serpapi_key

    finally:
        await conn.close()
async def researcher_node(state: AgentState) -> dict:

    llm  = await get_llm(
    state["user_id"]
)
    prefs = await get_user_preferences(
    state["user_id"]
)
    results       = state.get("results", {})
    uploaded_context = ""
    source_text = ""
    context_files = state.get("context_files", [])

    # ---------------------------------------------------
    # Find pending researcher tasks
    # ---------------------------------------------------

    pending = [
        t for t in state.get("plan", [])
        if (
            t.get("assigned_to") == "researcher"
            and t.get("id") not in results
            and all(
                dep in results
                for dep in t.get("depends_on", [])
            )
        )
    ]

    if not pending:

        return {
            "messages": [
                AIMessage(
                    content="Researcher: no pending tasks."
                )
            ]
        }

    task = pending[0]

    log.info(
        "researcher_task",
        task_id=task.get("id"),
        task=task.get("task"),
    )

    # ---------------------------------------------------
    # STEP 1 — RAG
    # ---------------------------------------------------

 # ---------------------------------------------------
# STEP 1 — CONTEXT
# ---------------------------------------------------

    has_context_files = bool(context_files)

    uploaded_context = ""
    source_text = ""

    if has_context_files:

        rag_result = rag_tool.invoke({
            "query": task.get("task"),
            "context_files": context_files,
            "user_id": state["user_id"],
            "threshold": prefs.get("rag_threshold", 1.5),
        })

        uploaded_context = rag_result["answer"]
        source_text = ", ".join(
        rag_result.get("sources", [])
)

        log.info(
            "research_context",
            files=context_files,
            sources=rag_result.get("sources", []),
        )

    else:

        uploaded_context = ""
        

    # ---------------------------------------------------
    # STEP 2 — WEB SEARCH
    # ---------------------------------------------------

    log.info("STEP_2_START_WEB")

    search_results = ""

    if not has_context_files:

        try:

            if prefs["web_search"]:

                log.info(
                    "web_search_enabled",
                    enabled=True,
                )

                serp_key = await get_serpapi_key(
                    state["user_id"]
                )
                print("TASK =", task)
                print("TASK TYPE =", type(task))

                print("TASK VALUE =", task.get("task"))
                print("TASK VALUE TYPE =", type(task.get("task")))

                search_query = str(task.get("task", ""))

                print("SEARCH QUERY =", search_query)
                print("SEARCH QUERY TYPE =", type(search_query))

                search_results = web_search_tool.invoke({
                    "query": task.get("task"),
                    "api_key": serp_key,
                })
                print("SEARCH RESULTS TYPE =", type(search_results))
                print("SEARCH RESULTS VALUE =", search_results)
                            
                            

            else:

                log.info(
                    "web_search_enabled",
                    enabled=False,
                )

                search_results = (
                    "Web search disabled in settings."
                )

        except Exception as e:

            print("WEB SEARCH ERROR =", str(e))

            search_results = (
                f"Web search failed: {e}"
            )

            log.warning(
                "web_search_failed",
                error=str(e),
            )

    else:

        search_results = (
            "Skipped — using uploaded file context instead."
        )

        log.info(
            "web_search_skipped",
            reason="context_files provided",
        )

    log.info("STEP_2_DONE_WEB")
    if (
    not prefs["web_search"]
    and not context_files
):

        return {
            "messages": [
                AIMessage(
                    content=(
                        "Research cannot proceed because "
                        "Web Search is disabled and no "
                        "context files are selected."
                    )
                )
            ]
        }
    dependency_context = "\n\n".join(
    f"RESULT ({dep}):\n{results.get(dep,'')}"
    for dep in task.get("depends_on", [])
)

    # ---------------------------------------------------
    # Build system prompt
    # ---------------------------------------------------

    if has_context_files and  uploaded_context:

        system_content = """
    You are a senior research analyst.

    The user provided files as context.

    Rules:
    
    - Prioritize RAG results over web results.
    - Answer the task directly.
    - Mention the source file name when answering.
    - Use evidence from the uploaded files.
    - Be accurate and concise.
    - If the task requests comparison, compare explicitly.
    - If the task requests recommendations, provide one.
    - Do not hallucinate missing information.
    """

    else:

        system_content = """
    You are a senior research analyst.

    Use web search results, RAG results, and previous task results
    to answer the task.
    If previous task results exist, treat them as the primary
    subject of comparison and analysis.

    Rules:
    - Follow the task exactly.
    - Answer the task directly.
    - If the task requests comparison, compare options explicitly.
    - If the task requests tradeoffs, discuss tradeoffs.
    - If the task requests best practices, include them.
    - If the task requests a recommendation, provide one and justify it.
    - Use evidence from the supplied information.
    - Do not introduce unrelated technologies, architectures, or frameworks.
    - You are a researcher, not a coder.
    - Do NOT implement solutions.
    - Do NOT generate full code.
    - Do NOT write applications.
    - Only provide research findings, analysis, best practices, comparisons, API details, and recommendations.
    - If discussing APIs or frameworks, include exact imports, classes, methods, and usage patterns when available.
    - Avoid hallucinations.
    When researching APIs, SDKs, frameworks, or libraries:

    Include:
    - exact imports
    - exact class names
    - exact SDK methods
    - exact API usage patterns

    Provide short code examples when available.

    The output may be used directly by a coder.
    """

    # ---------------------------------------------------
    # STEP 3 — LLM SUMMARY
    # ---------------------------------------------------

    log.info("STEP_3_START_LLM")

    try:
        print("\n===== DEPENDENCY CONTEXT =====")
        print(dependency_context[:3000])
        print("==============================\n")

        summary = await llm.ainvoke([
            SystemMessage(content=system_content),
            
            

            HumanMessage(content=(
    f"""
Task:
{task.get('task')}

Instructions:
- Answer the task directly.
- Use only the supplied evidence.
- Use Previous Task Results when available.
- You are performing research, not implementation.
- Do not generate complete applications.
- Do not write production code.
- Provide findings, analysis, API details, tradeoffs, and recommendations.
- If researching APIs or SDKs, include exact imports, class names, and method names when available.
- If comparing approaches, compare the approaches found in Previous Task Results.
- End with a recommendation when requested.
- Do not introduce architectures, frameworks, or technologies that are not present in the supplied evidence.
- If Previous Task Results contain implementation outputs,base comparisons primarily on those outputs.
- If researching APIs, SDKs, frameworks, or libraries:
- Include exact imports.
- Include exact class names.
- Include exact method names.
- Include short code examples when available.

Previous Task Results:
{dependency_context}

Retrieved File Context:
{uploaded_context}

Sources:
{source_text}


Web Search Results:
{search_results}
"""
)),
        ])

        result_text = (
            summary.content.strip()
            if hasattr(summary, "content")
            else str(summary)
        )

    except Exception as e:

        result_text = (
            f"Research summarization failed: {e}"
        )

        log.error(
            "summarization_failed",
            error=str(e),
        )

    log.info("STEP_3_DONE_LLM")

    # ---------------------------------------------------
    # DONE
    # ---------------------------------------------------

    log.info(
        "researcher_done",
        task_id=task.get("id"),
    )

    return {
        "results": {
            **results,
            task.get("id"): result_text,
        },

        "messages": [
            AIMessage(
                content=result_text
            )
        ],
    }
