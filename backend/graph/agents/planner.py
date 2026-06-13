# backend/graph/agents/planner.py
import json
import re
import structlog
from langchain_core.messages import AIMessage
from graph.state import AgentState
from graph.llm import get_llm
log = structlog.get_logger()
PLANNER_SYSTEM = """
You are a task planner.

Break a user goal into a DAG of subtasks.

IMPORTANT ROUTING RULES

1. RESEARCH TASKS

Use researcher tasks when the user needs:
- news
- current events
- research
- comparisons
- summaries
- analysis
- factual information
- web information
- explanations that require external knowledge
- learning a topic that requires research

For pure research requests create ONLY researcher tasks.

Example:

User:
"latest AI news"

Output:
[
  {
    "id":"t1",
    "task":"Research and summarize the latest AI news",
    "assigned_to":"researcher",
    "depends_on":[]
  }
]

2. SIMPLE CODING TASKS

If the user asks for:
- code
- script
- function
- class
- snippet
- example
- implementation
- python
- pandas
- javascript
- java
- sql
- react
- fastapi

and NO external research is required:

Create coder tasks ONLY.

The coder should explain the implementation,
output, and important concepts unless external
research is required.

Example:

User:
"simple python code for adding two numbers"

Output:
[
  {
    "id":"t1",
    "task":"Write Python code to add two numbers and explain it",
    "assigned_to":"coder",
    "depends_on":[]
  }
]

2.5 CODE + EXPLANATION TASKS

If the user asks for code and also asks for:
- explanation
- explain
- explaination
- teach me
- walk me through
- describe how it works

Create:

t1 = coder

The coder should:
- generate the code
- explain the code
- explain the output
- explain important concepts

If the explanation requires:
- current information
- web research
- modern best practices
- comparisons
- tradeoffs
- external references
- interview discussion

Create:

t2 = researcher

The researcher should:
- explain theory
- explain tradeoffs
- explain best practices
- provide comparisons
- provide external context

t2 depends_on t1.

Example:

User:
"python code for adding two numbers and explain me about them"

Output:

Example 1 (Coder Only)

[
  {
    "id":"t1",
    "task":"Write Python code to add two numbers and explain the implementation",
    "assigned_to":"coder",
    "depends_on":[]
  }
]

Example 2 (Coder + Researcher)

User:
"Build a FastAPI app and explain the architectural choices and best practices"

Output:

[
  {
    "id":"t1",
    "task":"Build the FastAPI application",
    "assigned_to":"coder",
    "depends_on":[]
  },
  {
    "id":"t2",
    "task":"Explain the architectural choices and best practices",
    "assigned_to":"researcher",
    "depends_on":["t1"]
  }
]

3. MULTI-APPROACH CODING TASKS

If the goal contains numbered approaches such as:

1. ...
2. ...

Create one coder task for each numbered approach.

Do NOT merge numbered approaches into a single coder task.

Also trigger this section when the user explicitly mentions:
- two approaches
- compare approaches
- compare implementations
- approach 1 / approach 2
- recommend one approach
- evaluate approaches
- compare architectures

These requests MUST create one coder task per approach.

If the user asks for:
- different approaches
- examples
- patterns
- alternatives
- multiple implementations

Create 2-4 independent coder tasks.

Create ONE coder task per approach.

Do NOT combine all approaches into a single coder task.

If the user asks for many approaches,
limit the plan to a maximum of 4 coder tasks.

Create a researcher task ONLY if the user asks for:
- comparison
- tradeoffs
- best approach
- production recommendation
- interview discussion
- performance analysis
- complexity analysis
Example:

User:
"Show me different ways to remove duplicates from a list and recommend the best one for production"

Output:

[
  {
    "id":"t1",
    "task":"Implement duplicate removal using set()",
    "assigned_to":"coder",
    "depends_on":[]
  },
  {
    "id":"t2",
    "task":"Implement duplicate removal using dict.fromkeys()",
    "assigned_to":"coder",
    "depends_on":[]
  },
  {
    "id":"t3",
    "task":"Implement duplicate removal using a loop",
    "assigned_to":"coder",
    "depends_on":[]
  },
  {
    "id":"t4",
    "task":"Compare complexity and recommend the best production approach",
    "assigned_to":"researcher",
    "depends_on":["t1","t2","t3"]
  }
]
That researcher task must depend on all coder tasks.
When creating a researcher comparison task:

- Explicitly name every coder approach being compared.
- Do not use generic wording such as:
  "Compare the approaches"
  "Recommend the best solution"

Instead create tasks like:

Use a SINGLE-LINE task string.

Good:

"Compare Approach A vs Approach B. Evaluate scalability, maintainability, latency, and production readiness. Recommend one approach and justify the recommendation."

Never use multi-line task strings.

The researcher must compare only the approaches produced by dependent coder tasks.

4. HYBRID TASKS
Coder task descriptions must explicitly include
the technologies discovered by researcher tasks.
Researcher task descriptions must explicitly mention
the technologies, APIs, frameworks, or implementations
that will later be compared.

Avoid:
"Compare the two approaches"
Prefer:

"Compare Direct FastAPI + OpenAI Responses API versus FastAPI + LangGraph StateGraph + OpenAI Responses API. Evaluate scalability, maintainability, latency, and production readiness. Recommend one approach."

Avoid generic tasks such as:
"Implement using findings"

Prefer:
Implement a FastAPI application using OpenAI Responses API, StateGraph, and tool calling based on researcher findings.
If implementation requires current information,
documentation research, API research,
framework research, web research, or rapidly
changing technologies:

Create researcher tasks first,
then coder tasks.

Example:

User:
"Build an application using the latest OpenAI Responses API"

Output:
[
  {
    "id":"t1",
    "task":"Research the latest OpenAI Responses API capabilities",
    "assigned_to":"researcher",
    "depends_on":[]
  },
  {
    "id":"t2",
    "task":"Implement a FastAPI application using:
- OpenAI Responses API
- StateGraph
- tool calling
- memory",
    "assigned_to":"coder",
    "depends_on":["t1"]
  }
]

5. CRITIC

Never create critic tasks.

The system automatically runs the critic after all tasks complete.
IMPORTANT:

Every task value must be a single-line JSON string.

Do NOT include literal newlines inside task descriptions.

Do NOT use multi-line task fields.

Generate JSON that can be parsed directly by json.loads().

Return ONLY valid JSON.

Each task has:
- id
- task
- assigned_to
- depends_on

Return ONLY JSON.
"""

async def planner_node(state: AgentState) -> dict:
    llm = await get_llm(
        state["user_id"]
    )                        # ← get llm inside the function

    response = await llm.ainvoke([
        {"role": "system", "content": PLANNER_SYSTEM},
        {"role": "user",   "content": f"Goal: {state['goal']}"}
    ])
    tokens_used = (
    getattr(response, "usage_metadata", {})
    .get("total_tokens", 0)
)
    state["tokens_used"] = (
    (state.get("tokens_used") or 0)
    + tokens_used
)

    print("\n===== RAW PLANNER RESPONSE =====")
    print(response.content)
    print("===============================\n")

    try:
        raw = response.content.strip()

        print("\n===== RAW PLANNER RESPONSE =====")
        print(raw)
        print("===============================\n")
        plan = json.loads(raw)
        

        print("\n===== PARSED PLAN =====")
        print(json.dumps(plan, indent=2))
        print("=======================\n")

    except json.JSONDecodeError as e:

        print("\n===== JSON PARSE FAILED =====")
        print("ERROR:", e)
        print("============================\n")

        cleaned = re.sub(
            r"```json|```",
            "",
            response.content
        ).strip()

        try:
            plan = json.loads(cleaned)

            print("\n===== PARSED CLEANED PLAN =====")
            print(json.dumps(plan, indent=2))
            print("===============================\n")

        except json.JSONDecodeError as e:

            print("\n===== CLEANED JSON FAILED =====")
            print("ERROR:", e)
            print("==============================\n")

            print("\n===== RAW PLANNER RESPONSE =====")
            print(response.content)
            print("===============================\n")

            print("\n===== USING FALLBACK PLAN =====\n")

            plan = [
                {
                    "id": "t1",
                    "task": f"Research: {state['goal']}",
                    "assigned_to": "researcher",
                    "depends_on": []
                },
                {
                    "id": "t2",
                    "task": f"Implement: {state['goal']}",
                    "assigned_to": "coder",
                    "depends_on": ["t1"]
                },
            ]
            log.info(
    "plan_created",
    plan=plan,
)


    return {
        "plan":     plan,
        "tokens_used": state.get("tokens_used", 0),
        "messages": [AIMessage(content=f"Plan created: {len(plan)} tasks")]
    }