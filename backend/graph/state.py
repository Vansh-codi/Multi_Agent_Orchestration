# # # graph/state.py
# # from typing import TypedDict, Annotated, Literal
# # from langgraph.graph.message import add_messages

# # class AgentState(TypedDict):
# #     # The original user goal — never mutated
# #     goal: str

# #     # Conversation / scratchpad messages (append-only via add_messages)
# #     messages: Annotated[list, add_messages]

# #     # Structured plan output from Planner agent
# #     plan: list[dict]           # [{id, task, depends_on, assigned_to}]

# #     # Accumulated results keyed by task id
# #     results: dict[str, str]

# #     # Which agent runs next (Supervisor sets this)
# #     next: Literal["planner", "researcher", "coder", "critic", "END"]

# #     # Whether Critic approved the final result
# #     approved: bool

# #     # Error message if any node fails
# #     error: str | None


# from typing import TypedDict, Annotated, Literal
# from langgraph.graph.message import add_messages


# # class AgentState(TypedDict):

# #     # ---------------------------------------------------
# #     # Original user goal
# #     # ---------------------------------------------------

# #     goal: str

# #     # ---------------------------------------------------
# #     # Conversation / scratchpad messages
# #     # ---------------------------------------------------

# #     messages: Annotated[list, add_messages]

# #     # ---------------------------------------------------
# #     # Planner output
# #     # ---------------------------------------------------

# #     plan: list[dict]

# #     # ---------------------------------------------------
# #     # Task results
# #     # ---------------------------------------------------

# #     results: dict[str, str]

# #     # ---------------------------------------------------
# #     # Next node selected by supervisor
# #     # ---------------------------------------------------

# #     next: Literal[
# #         "planner",
# #         "researcher",
# #         "coder",
# #         "critic",
# #         "END",
# #     ]

# #     # ---------------------------------------------------
# #     # Final approval flag
# #     # ---------------------------------------------------

# #     approved: bool

# #     # ---------------------------------------------------
# #     # Error handling
# #     # ---------------------------------------------------

# #     error: str | None

# #     # ---------------------------------------------------
# #     # Workflow tracking
# #     # ---------------------------------------------------

# #     iterations: int

# #     last_agent: str
# #     context_files: list
#     # backend/graph/state.py
# from typing import Optional, TypedDict


# class AgentState(TypedDict):
#     goal:          str
#     messages:      list
#     plan:          list
#     results:       dict
#     next:          str
#     approved:      bool
#     error:         Optional[str]
#     context_files: list
#     user_id:       str   # ← added for per-user file isolation


# backend/graph/state.py
from typing import Optional, TypedDict, Annotated
from langgraph.graph.message import add_messages


def merge_results(existing: dict, new: dict) -> dict:
    return {**existing, **new}




class AgentState(TypedDict):
    goal:          str
    messages:      Annotated[list, add_messages]
    plan:          list
    results:       Annotated[dict, merge_results]
    next:          str
    approved:      bool
    error:         Optional[str]
    context_files: list
    user_id:       str

    # NEW
    tokens_used:   int