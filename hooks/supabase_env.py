"""MkDocs hook: inject Supabase credentials into the built JS from env vars.

Runs on every `mkdocs build` and `mkdocs serve`. By default it injects the DEV
credentials; when DEPLOY_ENV=prod (set by deploy.py --release) it injects the
PROD credentials. All values come from supabase.env, loaded by activate.bat.
"""
import os

_TARGET = os.path.join("assets", "js", "global", "config.js")


def on_post_build(config, **kwargs):
    path = os.path.join(config["site_dir"], _TARGET)
    if not os.path.isfile(path):
        return

    dev = False if os.environ.get("DEPLOY_ENV") == "prod" else True
    prefix = "SUPABASE_DEV" if dev else "SUPABASE_PROD"
    url = os.environ.get(f"{prefix}_URL", "")
    key = os.environ.get(f"{prefix}_ANON_KEY", "")

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("__DEPLOY_DEV__", "true" if dev else "false")
    content = content.replace("__SUPABASE_URL__", url)
    content = content.replace("__SUPABASE_ANON_KEY__", key)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
