#!/usr/bin/env python3
import os
import sys
import subprocess
import shutil
import re
import yaml
import argparse

__TESTING__ = os.getenv("RCS_TESTING", "FALSE")  # for testing development only
PROJECT_ROOT_FOLDER = os.path.expandvars("$PROJECT_ROOT_FOLDER")
if __TESTING__ == "TRUE":
    print("==== TESTING MODE ENABLED ====")
SEPARATOR = "-----------------------------"

# -----------------------------------------
# Helpers
# -----------------------------------------
def error(msg: str):
    print(f"❌ {msg}")


def success(msg: str):
    print(f"✅ {msg}")


def run(cmd, cwd=None, check=True, print_cmd=False, noexit=False):
    """Run a shell command with optional working directory."""
    if print_cmd:
        print(f"$ {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if check and result.returncode != 0:
        error(f"command failed: {cmd}")
        if not noexit:
            sys.exit(1)
    return result.returncode


def yesno(prompt):
    """Ask the user (y/n/q)"""
    ans = input(prompt + " (y/n/q) ").strip().lower()
    if ans == "q":
        print("exit requested by user")
        sys.exit(0)
    return ans == "y"

# -----------------------------------------
# WORKFLOW
# -----------------------------------------
def initialization() -> str:
    print("[[[[[[ Initialization ]]]]]]")

    # detect release hash
    hash = subprocess.check_output("git rev-parse --short HEAD", shell=True).decode().strip()
    print(f"Detected release hash: {hash}")
    return hash


def check_git_repos():
    print("[[[[[[ Check git repositories ]]]]]]")
    err = 0

    # check repo is clean
    dirty = subprocess.check_output("git status --porcelain", shell=True).decode()
    if dirty.strip():
        error("repo is NOT clean:")
        print(dirty)
        err = 1
    else:
        success("repo is clean")

    # check repo points to origin/master
    run("git fetch -p", check=False)
    head = subprocess.check_output("git rev-parse HEAD", shell=True).decode().strip()
    origin = subprocess.check_output("git rev-parse origin/main", shell=True).decode().strip()
    if head != origin:
        error("HEAD does NOT point to origin/main")
        err = 1

    if err > 0:
        sys.exit(1)

    print(SEPARATOR)


def build():
    print("[[[[[[ Build website with Mkdocs ]]]]]]")
    run(f"mkdocs build")
    success("Built with success")
    print(SEPARATOR)


def patch_js_version(hash: str):
    print("[[[[[[ path .js import with hash ]]]]]]")
    
    pattern = re.compile(r"\.js\?v=dev")
    replacement = f".js?v={hash}"

    for root, _, files in os.walk(os.path.join(PROJECT_ROOT_FOLDER, "site")):
        for filename in files:
            if not filename.lower().endswith((".md", ".js", ".yaml", "html")):
                continue

            path = os.path.join(root, filename)

            if not os.path.isfile(path):
                continue

            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            new_content = pattern.sub(replacement, content)

            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated: {filename}")

    success("Patch site/ with success")
    print(SEPARATOR)


def push():
    print("[[[[[[ Publish on GitHub ]]]]]]")
    run(f"ghp-import -n -p -f site")
    success("Pushed with success on GitHub")
    print(SEPARATOR)


# -----------------------------------------
# Main
# -----------------------------------------
if __name__ == "__main__":
    hash = initialization()
    # check_git_repos()
    build()
    patch_js_version(hash)
    push()
    sys.exit(0)