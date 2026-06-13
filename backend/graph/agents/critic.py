
import json
from graph.llm import get_llm
from langchain_core.messages import AIMessage
from graph.state import AgentState




CRITIC_SYSTEM = """
You are a practical quality reviewer.

Approve if:
- Code executed successfully and produced output
- Code was generated correctly but could not run due to missing dependencies
- Research results are relevant to the goal
- At least the core task was implemented
- Results are meaningful even if simple

Reject ONLY if:
- ALL executions completely failed with errors
- Outputs are entirely unrelated to the goal
- Nothing useful was produced at all

IMPORTANT: IMPORTANT:
For coding tasks, execution failures should normally result in rejection.
For research tasks, partial failures may still be approved.
Do NOT require perfection. Simple working code is good enough.

Reply ONLY valid JSON:
{"approved": true|false, "feedback": "..."}
"""


async def critic_node(state: AgentState) -> dict:
    results = state.get("results", {})

    if not results:
        return {
            "approved": False,
            "messages": [AIMessage(content="Critic rejected: No results to review.")]
        }

    # ── Count successes and failures ──────────────────────────
    success_count = 0
    partial_count = 0
    failure_count = 0
    total         = len(results)
    FAILURE_MARKERS = [
    "syntax error",
    "execution environment error",
    "docker execution failed",
    "traceback",

    "segmentation fault",
    "core dumped",
    "permission denied",
]

    PARTIAL_MARKERS = [
    "missing dependency",
    "modulenotfounderror",
    "importerror",

    "fatal error:",
    "no such file or directory",
    "cannot find",
    "library not found",
    "package is not installed",
    "opencv2/",
]
    

    for k, v in results.items():
        print(f"TASK {k}:")
        print(str(v)[:1000])
        print("----------------")

   

            

    for value in results.values():

        text = str(value)
        text_lower = str(value).lower()

      

        if any(marker in text_lower for marker in FAILURE_MARKERS):
            failure_count += 1

        elif any(marker in text_lower for marker in PARTIAL_MARKERS):
            partial_count += 1

        else:
            success_count += 1

    # ── Auto-approve: majority succeeded ─────────────────────
    # Even 1 failure is OK if others passed
    # Auto approve only when no hard failures
    print(
    "CRITIC COUNTS:",
    success_count,
    partial_count,
    failure_count,
    total,
)
    if failure_count == 0 and (success_count + partial_count) >= 1:
        return {
            "approved": True,
            "messages": [AIMessage(
                content=(
    "Critic approved. Task complete. "
    f"({success_count} succeeded, "
    f"{partial_count} dependency-limited, "
    f"{failure_count} failed)"
)
            )]
        }
    goal_lower = state["goal"].lower()

    is_coding = any(
        word in goal_lower
        for word in [
            "build",
            "create",
            "implement",
            "code",
            "app",
            "website",
            "script",
        ]
    )

    # 
    if (
    is_coding
    and failure_count > 0
    and success_count == 0
    and partial_count == 0
):
        return {
            "approved": False,
            "messages": [
                AIMessage(
                    content=(
                        f"Critic rejected. "
                        f"Code execution failed "
                        f"({failure_count} failed task(s))."
                    )
                )
            ]
        }

    # ── All failed — ask LLM for verdict ─────────────────────
    summary = "\n".join(
        f"[{tid}]: {str(res)[:300]}"
        for tid, res in results.items()
    )
    llm = await get_llm(
        state["user_id"]
)

    response = await llm.ainvoke([
        {"role": "system", "content": CRITIC_SYSTEM},
        {
    "role": "user",
    "content": f"""
Goal:
{state['goal']}

Successes: {success_count}
Dependency Limited: {partial_count}
Failures: {failure_count}

Results:
{summary}

Should this workflow be approved?

Reply only JSON.
"""
}
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
        cleaned = response.content.replace("```json","").replace("```","").strip()
        verdict = json.loads(cleaned)
    except Exception:
        # If all failed and LLM can't parse, still reject
        verdict = {"approved": False, "feedback": "All tasks failed."}

    if verdict.get("approved"):
        return {
            "approved": True,
            "messages": [AIMessage(content="Critic approved. Task complete.")]
        }

    return {
        "approved": False,
        "tokens_used": state.get("tokens_used", 0),
        "messages": [AIMessage(
            content=f"Critic rejected: {verdict.get('feedback')}"
        )]
    }