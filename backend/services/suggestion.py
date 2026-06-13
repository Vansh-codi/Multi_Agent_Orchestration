from services.preferences import (
    get_user_preferences,
)


async def add_suggestions(
    user_id: str,
    text: str,
) -> str:
    if not text:
        return text

    prefs = await get_user_preferences(
        user_id
    )

    if not prefs["smart_suggestion"]:
        return text

    return (
        text
        + "\n\nSuggested next actions:\n"
        + "• Generate a detailed report\n"
        + "• Compare related alternatives\n"
        + "• Explore deeper research"
    )