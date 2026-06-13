# # backend/tools/web_search.py
# from langchain_core.tools import tool
# from config import get_settings


# @tool
# def web_search_tool(query: str) -> str:
#     """Search the web for up-to-date information on a topic."""
#     from serpapi import GoogleSearch   # imported lazily so tests can mock it

#     settings = get_settings()
#     params = {
#         "q": query,
#         "api_key": settings.serpapi_key,  # from .env, never hardcoded
#         "num": 5,
#     }
#     results = GoogleSearch(params).get_dict()
#     snippets = [
#         f"{r.get('title', '')}: {r.get('snippet', '')}"
#         for r in results.get("organic_results", [])[:5]
#     ]
#     return "\n".join(snippets) if snippets else "No results found."
# backend/tools/web_search.py

from langchain_core.tools import tool
from serpapi import GoogleSearch


@tool

def web_search_tool(
    query: str,
    api_key: str,
) -> str:
    """Search the web for up-to-date information on a topic."""
    print(web_search_tool.args)

    params = {
        "q": query,
        "api_key": api_key,
        "num": 5,
    }

    results = GoogleSearch(params).get_dict()

    snippets = [
        f"{r.get('title', '')}: {r.get('snippet', '')}"
        for r in results.get("organic_results", [])[:5]
    ]

    return (
        "\n".join(snippets)
        if snippets
        else "No results found."
    )