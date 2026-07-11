#!/usr/bin/env python3
"""
Start KOSTIN Parfums backend server with uvicorn.
Usage:
    python scripts/start_server.py
    python scripts/start_server.py --host 0.0.0.0 --port 8000
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    import uvicorn
except ImportError:
    print("uvicorn is not installed. Install it with: pip install uvicorn")
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Start KOSTIN Parfums backend server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload on code changes")
    parser.add_argument("--skip-health-check", action="store_true", help="Skip startup health check")
    args = parser.parse_args()

    print(f"Starting KOSTIN Parfums backend on http://{args.host}:{args.port}")

    if not args.skip_health_check:
        try:
            from scripts.health_check import check_backend
            print("Running startup health check...")
            result = check_backend(f"http://{args.host}:{args.port}")
            print(result)
            if not result.get("ok"):
                print("Warning: backend health check failed. Server may not be fully ready.")
        except Exception as exc:
            print(f"Health check skipped due to error: {exc}")

    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
