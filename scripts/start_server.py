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
    args = parser.parse_args()

    print(f"Starting KOSTIN Parfums backend on http://{args.host}:{args.port}")
    uvicorn.run(
        "server.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
