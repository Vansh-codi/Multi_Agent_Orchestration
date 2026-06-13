async def execute_java(filepath: str):

    import subprocess
    import os

    classname = os.path.splitext(
        os.path.basename(filepath)
    )[0]

    compile_result = subprocess.run(
        ["javac", filepath],
        capture_output=True,
        text=True,
        timeout=15,
    )

    if compile_result.returncode != 0:
        return compile_result.stderr

    run_result = subprocess.run(
        ["java", classname],
        capture_output=True,
        text=True,
        timeout=10,
        cwd=os.path.dirname(filepath),
    )

    return run_result.stdout or run_result.stderr