from tools.docker_executor import execute_in_docker


async def execute_javascript(filepath: str):

    return await execute_in_docker(
        filepath,
        "javascript",
    )