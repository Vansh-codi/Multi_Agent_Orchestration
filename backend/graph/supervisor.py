
# backend/graph/agents/supervisor.py
import json
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from graph.llm import get_llm
from graph.state import AgentState

SUPERVISOR_SYSTEM = """
You are an orchestrator managing a team of AI agents.

Agents:
- planner: Breaks a goal into a structured DAG of subtasks
- researcher: Searches the web and retrieves relevant docs
- coder: Writes and executes Python code
- critic: Reviews outputs and approves or requests revisions

Given the current state, decide who should act next.

Reply with ONLY valid JSON:
{"next": "planner"|"researcher"|"coder"|"critic"|"END", "reason": "..."}

Rules:
- Always call planner first if no plan exists.
- Call END only after critic approves.
- Do not repeatedly call agents with no runnable tasks.
- Avoid infinite loops.
"""


async def supervisor_node(state: AgentState) -> dict:
    llm     = llm = await get_llm(
    state["user_id"]
)
    plan    = state.get("plan", [])
    results = state.get("results", {})

    # ── Stop if critic approved ───────────────────────────────
    if state.get("approved"):
        return {
            "next": "END",
            "messages": [AIMessage(content="Critic approved. Ending workflow.")]
        }

    # ── Deadlock detection — RELAXED thresholds ───────────────
    recent = [
        m.content.lower()
        for m in state.get("messages", [])[-10:]
        if hasattr(m, "content")
    ]

    coder_idle      = sum("nothing to do" in m for m in recent)
    critic_rejects  = sum("critic rejected" in m for m in recent)
    exec_failures   = sum( ("syntax error" in m or "execution environment error" in m)
    for m in recent
)

    # Only stop on severe deadlock — not on single failures
    if coder_idle >= 3 or critic_rejects >= 5 or exec_failures >= 5:
        return {
            "next": "END",
            "messages": [AIMessage(content="Workflow stopped due to repeated deadlocks or failures.")]
        }

    # ── Planner first ─────────────────────────────────────────
    if not plan:
        return {"next": "planner", "messages": [AIMessage(content="Routing to planner")]}

    # ── Find runnable tasks ───────────────────────────────────
    researcher_ready = False
    coder_ready      = False

    for task in plan:
        tid        = task.get("id")
        done       = tid in results
        deps_done  = all(d in results for d in task.get("depends_on", []))
        assigned   = task.get("assigned_to")

        if done or not deps_done:
            continue

        if assigned == "researcher":
            researcher_ready = True
        if assigned == "coder":
            coder_ready = True

    if researcher_ready:
        return {"next": "researcher", "messages": [AIMessage(content="Routing to researcher")]}

    if coder_ready:
        return {"next": "coder", "messages": [AIMessage(content="Routing to coder")]}

    # ── All tasks done → critic ───────────────────────────────
# ── All tasks done → critic ───────────────────────────────
    all_done = all(t.get("id") in results for t in plan)

    if all_done:

        critic_ran = any(
            hasattr(m, "content")
            and (
                "critic approved" in m.content.lower()
                or "critic rejected" in m.content.lower()
            )
            for m in state.get("messages", [])
        )

        if critic_ran:
            return {
                "next": "END",
                "messages": [
                    AIMessage(
                        content="Workflow finished."
                    )
                ]
            }

        return {
            "next": "critic",
            "messages": [
                AIMessage(content="Routing to critic")
            ]
        }

    # ── LLM fallback ──────────────────────────────────────────
    context = f"Goal:\n{state.get('goal')}\n\nCompleted: {list(results.keys())}\n\nRecent: {recent}"
    response = await llm.ainvoke([
    SystemMessage(content=SUPERVISOR_SYSTEM),
    HumanMessage(content=context),
    ])

    tokens_used = (
        getattr(response, "usage_metadata", {})
        .get("total_tokens", 0)
    )

    state["tokens_used"] = (
        (state.get("tokens_used") or 0)
        + tokens_used
    )
    try:
        cleaned  = response.content.replace("```json","").replace("```","").strip()
        decision = json.loads(cleaned)
        next_node = decision.get("next", "critic")
        if next_node not in {"planner","researcher","coder","critic","END"}:
            next_node = "critic"
    except Exception:
        next_node = "critic"

    return {
        "tokens_used": state.get("tokens_used", 0),
        "next": next_node,
        "messages": [AIMessage(content=f"Routing to {next_node}")]
    }