"""Filesystem paths that do not depend on the process working directory.

Render (and Docker) run each service with its own working directory, so any
hard-coded relative path such as ``backend/app/models_artifact/...`` would
break in production. Everything is resolved relative to this module instead.
"""

import os

# backend/app/core/paths.py -> backend/app/models_artifact
ARTIFACT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, "models_artifact")
)


def artifact_path(filename: str) -> str:
    """Absolute path of a file inside backend/app/models_artifact/."""
    return os.path.join(ARTIFACT_DIR, filename)
