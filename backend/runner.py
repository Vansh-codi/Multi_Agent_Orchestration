# backend/runner.py

import traceback
import os
import subprocess

LANGUAGE = os.getenv(
    "LANGUAGE",
    "python"
)

if LANGUAGE == "python":

    with open("/tmp/code", "r", encoding="utf-8") as f:
        code = f.read()

# ------------------------------------------------------------------
# Block dangerous modules
# ------------------------------------------------------------------

BLOCKED_MODULES = {
    "os",
    "subprocess",
    "socket",
    "shutil",
    "pathlib",
    "multiprocessing",
    "signal",
    "ctypes",
    "resource",
    "pwd",
    "grp",
    "sys",
    "importlib",
    "inspect",
}


def safe_import(
    name,
    globals=None,
    locals=None,
    fromlist=(),
    level=0,
):
    root = name.split(".")[0]

    if root in BLOCKED_MODULES:
        raise ImportError(
            f"Module '{root}' is not allowed"
        )

    return __import__(
        name,
        globals,
        locals,
        fromlist,
        level,
    )


safe_builtins = {
    # ── Output ───────────────────────────────
    "print": print,

    # ── Math ─────────────────────────────────
    "len": len,
    "range": range,
    "min": min,
    "max": max,
    "sum": sum,
    "abs": abs,
    "round": round,
    "pow": pow,
    "divmod": divmod,

    # ── Iteration ────────────────────────────
    "enumerate": enumerate,
    "zip": zip,           # ← was missing
    "map": map,           # ← was missing
    "filter": filter,     # ← was missing
    "reversed": reversed, # ← was missing
    "sorted": sorted,
    "any": any,           # ← was missing
    "all": all,           # ← was missing
    "next": next,         # ← was missing
    "iter": iter,         # ← was missing

    # ── Types ────────────────────────────────
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "list": list,
    "dict": dict,
    "set": set,
    "tuple": tuple,
    "bytes": bytes,
    "type": type,
    "object": object,

    # ── Introspection ─────────────────────────
    "isinstance": isinstance,
    "issubclass": issubclass,
    "hasattr": hasattr,
    "getattr": getattr,
    "callable": callable,

    # ── Exceptions ───────────────────────────
    "Exception": Exception,
    "ValueError": ValueError,
    "TypeError": TypeError,
    "KeyError": KeyError,
    "IndexError": IndexError,
    "RuntimeError": RuntimeError,
    "StopIteration": StopIteration,
    "ImportError": ImportError,

    # ── Misc ─────────────────────────────────
    "repr": repr,
    "hash": hash,
    "id": id,
    "vars": vars,
    "format": format,
    # "open": open,         # needed for file ops
    "__build_class__": __build_class__,
    "property": property,
    "classmethod": classmethod,
    "staticmethod": staticmethod,
    "super": super,

    "__import__": safe_import,  # safe for stdlib imports
}

exec_globals = {
    "__builtins__": safe_builtins,
    "__name__": "__main__",
}
try:

    if LANGUAGE == "python":

        exec(code, exec_globals)

    elif LANGUAGE == "javascript":

        subprocess.run(
            ["node", "/tmp/code"],
            check=True,
            capture_output=False,
        )

    elif LANGUAGE == "go":

        subprocess.run(
            ["go", "run", "/tmp/code"],
            check=True,
            capture_output=False,
        )
    elif LANGUAGE == "c":

        result = subprocess.run(
            [
                "gcc",
                "-x",
                "c",
                "/tmp/code",
                "-o",
                "/tmp/app"
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(result.stderr)
            error = result.stderr

            if (
                "No such file or directory" in error
                or "opencv2/" in error
            ):
                raise RuntimeError(
                    "Missing Dependency\n\n"
                    + error
                )

            raise RuntimeError(error)

        subprocess.run(
            ["/tmp/app"],
            check=True,
        )

    elif LANGUAGE == "cpp":

        result = subprocess.run(
            [
                "g++",
                "-x",
                "c++",
                "/tmp/code",
                "-o",
                "/tmp/app"
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(result.stderr)
            error = result.stderr

            if (
                "No such file or directory" in error
                or "opencv2/" in error
            ):
                raise RuntimeError(
                    "Missing Dependency\n\n"
                    + error
                )

            raise RuntimeError(error)

        subprocess.run(
            ["/tmp/app"],
            check=True,
        )

    else:

        print(
            f"Unsupported language: {LANGUAGE}"
        )

except ModuleNotFoundError as e:

    missing_pkg = getattr(
        e,
        "name",
        "unknown"
    )

    print(
        "⚠️ Missing Dependency\n\n"
        f"Package: {missing_pkg}\n\n"
        "Code was generated successfully,\n"
        "but execution could not continue because\n"
        "the package is not installed."
    )

except ImportError as e:

    print(
        "⚠️ Restricted Import\n\n"
        f"{str(e)}"
    )

except Exception as e:

    print(
        "❌ Execution Failed\n\n"
        f"{str(e)}"
    )