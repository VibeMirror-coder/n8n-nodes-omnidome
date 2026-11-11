#!/usr/bin/env python3
"""Publish the public static OmniDome Space using the Hugging Face API."""
from __future__ import annotations

import os
from pathlib import Path

from huggingface_hub import HfApi

token = os.environ.get("HF_TOKEN", "").strip()
if not token:
    raise SystemExit("HF_TOKEN GitHub Actions secret is required; no Space was published.")

api = HfApi(token=token)
whoami = api.whoami(token=token)
owner = str(whoami.get("name") or "").strip()
if not owner:
    raise SystemExit("Hugging Face authenticated account name is missing.")

repo_id = f"{owner}/omnidome-agent-reliability"
directory = Path(__file__).resolve().parents[1] / "integrations" / "huggingface-space"
assert (directory / "README.md").is_file()
assert (directory / "index.html").is_file()

api.create_repo(
    repo_id=repo_id,
    repo_type="space",
    space_sdk="static",
    private=False,
    exist_ok=True,
    token=token,
)
commit = api.upload_folder(
    folder_path=str(directory),
    repo_id=repo_id,
    repo_type="space",
    commit_message="Sync public OmniDome Agent Reliability Space",
    token=token,
)
print(f"SPACE_PUBLISHED=https://huggingface.co/spaces/{repo_id}")
print(f"COMMIT={commit.oid}")
