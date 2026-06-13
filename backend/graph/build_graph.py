# # graph/build_graph.py

# from langgraph.graph import StateGraph, END

# from graph.state import AgentState
# from graph.supervisor import supervisor_node
# from graph.agents.planner import planner_node
# from graph.agents.researcher import researcher_node
# from graph.agents.coder import coder_node
# from graph.agents.critic import critic_node


# def build_graph() -> StateGraph:
#     g = StateGraph(AgentState)

#     # ---------------------------------------------------
#     # Register nodes
#     # ---------------------------------------------------

#     g.add_node("supervisor", supervisor_node)
#     g.add_node("planner", planner_node)
#     g.add_node("researcher", researcher_node)
#     g.add_node("coder", coder_node)
#     g.add_node("critic", critic_node)

#     # ---------------------------------------------------
#     # Entry point
#     # ---------------------------------------------------

#     g.set_entry_point("supervisor")

#     # ---------------------------------------------------
#     # Supervisor routing
#     # ---------------------------------------------------

#     g.add_conditional_edges(
#         "supervisor",
#         lambda state: state.get("next", "END"),
#         {
#             "planner": "planner",
#             "researcher": "researcher",
#             "coder": "coder",
#             "critic": "critic",
#             "END": END,
#         },
#     )

#     # ---------------------------------------------------
#     # Agent -> supervisor loop
#     # ---------------------------------------------------

#     g.add_edge("planner", "supervisor")
#     g.add_edge("researcher", "supervisor")
#     g.add_edge("coder", "supervisor")
#     g.add_edge("critic", "supervisor")

#     # ---------------------------------------------------
#     # Compile graph
#     # ---------------------------------------------------

#     return g.compile()


# # Compile once globally
# GRAPH = build_graph()

from langgraph.graph import StateGraph, END
from graph.state import AgentState
from graph.supervisor import supervisor_node
from graph.agents.planner import planner_node
from graph.agents.researcher import researcher_node
from graph.agents.coder import coder_node
from graph.agents.critic import critic_node

def build_graph() -> StateGraph:
    g = StateGraph(AgentState)

    # Register nodes
    g.add_node("supervisor", supervisor_node)
    g.add_node("planner", planner_node)
    g.add_node("researcher", researcher_node)
    g.add_node("coder", coder_node)
    g.add_node("critic", critic_node)

    # Entry point
    g.set_entry_point("supervisor")

    # Supervisor routing
    g.add_conditional_edges(
        "supervisor",
        lambda state: state.get("next", "END"),
        {
            "planner": "planner",
            "researcher": "researcher",
            "coder": "coder",
            "critic": "critic",
            "END": END,
        },
    )

    # Agent → supervisor loop
    g.add_edge("planner", "supervisor")
    g.add_edge("researcher", "supervisor")
    g.add_edge("coder", "supervisor")
    g.add_edge("critic", "supervisor")

    return g.compile()

# Compile once globally
GRAPH = build_graph()
