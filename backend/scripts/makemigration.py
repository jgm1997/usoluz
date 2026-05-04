#!/usr/bin/env python3
"""Usage: python scripts/makemigration.py <message> [--no-autogenerate]"""
import os
import sys

from alembic import command
from alembic.config import Config

versions_dir = os.path.join(os.path.dirname(__file__), "..", "alembic", "versions")
existing = [f for f in os.listdir(versions_dir) if f.endswith(".py") and not f.startswith("__")]
next_num = len(existing) + 1

cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
cfg.set_main_option("file_template", f"{next_num:04d}_%%(slug)s")

args = sys.argv[1:]
autogenerate = "--no-autogenerate" not in args
message = next((a for a in args if not a.startswith("--")), "migration")

command.revision(cfg, message=message, autogenerate=autogenerate)
