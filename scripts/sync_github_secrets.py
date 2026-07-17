#!/usr/bin/env python3
"""
KOSTIN Parfums — GitHub Secrets and Variables Syncer
Syncs local .env variables to the remote GitHub repository using the GitHub CLI (gh).
"""
import subprocess
import sys
import os
from pathlib import Path

REPO = "malka-kaska/kostinparfums"

def main():
    repo_root = Path(__file__).resolve().parent.parent
    env_path = repo_root / ".env"
    
    if not env_path.exists():
        print(f"Error: .env file not found at {env_path}")
        sys.exit(1)
        
    print(f"Syncing environment variables and secrets to GitHub repo: {REPO}")
    
    # Parse env vars
    with open(env_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
            
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        
        # Strip surrounding quotes
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
            
        if not key:
            continue
            
        # Classify as secret or variable
        is_secret = any(s in key.upper() for s in ["KEY", "SECRET", "TOKEN", "PASSWORD", "URL"])
        
        if is_secret:
            print(f"Setting secret: {key}")
            try:
                proc = subprocess.Popen(
                    ["gh", "secret", "set", key, "-R", REPO],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                stdout, stderr = proc.communicate(input=val)
                if proc.returncode != 0:
                    print(f"  Failed: {stderr.strip()}")
            except Exception as e:
                print(f"  Error: {e}")
        else:
            print(f"Setting variable: {key}")
            try:
                proc = subprocess.run(
                    ["gh", "variable", "set", key, "-b", val, "-R", REPO],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                if proc.returncode != 0:
                    print(f"  Failed: {proc.stderr.strip()}")
            except Exception as e:
                print(f"  Error: {e}")
                
    print("\nSync completed!")

if __name__ == "__main__":
    main()
