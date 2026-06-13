async def execute_typescript(filepath: str):

    import subprocess

    result = subprocess.run(
        ["npx", "ts-node", filepath],
        capture_output=True,
        text=True,
        timeout=10,
    )

    return result.stdout or result.stderr