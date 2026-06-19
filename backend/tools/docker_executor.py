# import subprocess


# async def execute_in_docker(
#     filepath: str,
#     language: str,
# ) -> str:

#     result = subprocess.run(
#         [
#             "docker",
#             "run",
#             "--rm",

#             "--memory=128m",
#             "--cpus=1",

#             "--network=none",

#             "-v",
#             f"{filepath}:/tmp/code:ro",

#             "-e",
#             f"LANGUAGE={language}",

#             "agent-executor",
#         ],
#         capture_output=True,
#         text=True,
#         timeout=20,
#         encoding="utf-8",
#         errors="replace",
#     )

#     return result.stdout or result.stderr
import subprocess
import os

EXECUTION_MODE = os.getenv(
    "EXECUTION_MODE",
    "docker"
)

RUNNER_URL = os.getenv(
    "RUNNER_URL",
    ""
)

async def execute_in_docker(
    filepath: str,
    language: str,
) -> str:

    if EXECUTION_MODE == "docker":

        result = subprocess.run(
            [
                "docker",
                "run",
                "--rm",
                "--memory=128m",
                "--cpus=1",
                "--network=none",
                "-v",
                f"{filepath}:/tmp/code:ro",
                "-e",
                f"LANGUAGE={language}",
                "agent-executor",
            ],
            capture_output=True,
            text=True,
            timeout=20,
            encoding="utf-8",
            errors="replace",
        )

        return result.stdout or result.stderr

    raise RuntimeError(
        "Remote runner not configured"
    )