#!/usr/bin/env python3
"""
KOSTIN Parfums — health check for backend/frontend/meta endpoints.
Usage:
    python scripts/health_check.py
    python scripts/health_check.py --backend-url http://localhost:8000 --frontend-url https://kostinparfums.com
"""

import argparse
import sys
import time

try:
    import requests
except ImportError:
    requests = None


def check_backend(url: str, timeout: int = 5) -> dict:
    result = {"name": "backend", "url": url, "ok": False}
    try:
        if requests is None:
            result["error"] = "requests not installed"
            return result
        start = time.time()
        response = requests.get(f"{url}/health", timeout=timeout)
        elapsed = time.time() - start
        result["status_code"] = response.status_code
        result["latency_ms"] = int(elapsed * 1000)

        if response.status_code != 200:
            result["error"] = response.text[:200]
            return result

        try:
            body = response.json()
        except Exception:
            result["error"] = "Backend health endpoint returned non-JSON content"
            return result

        result["body"] = body
        if body.get("status") != "healthy" or body.get("service") != "kostin-backend":
            result["error"] = "Backend health payload is missing status=healthy or service=kostin-backend"
            return result

        result["ok"] = True
    except Exception as exc:
        result["error"] = str(exc)
    return result


def check_frontend(url: str, timeout: int = 10) -> dict:
    result = {"name": "frontend", "url": url, "ok": False}
    try:
        if requests is None:
            result["error"] = "requests not installed"
            return result
        start = time.time()
        response = requests.get(url, timeout=timeout, allow_redirects=True)
        elapsed = time.time() - start
        result["ok"] = response.status_code == 200
        result["status_code"] = response.status_code
        result["latency_ms"] = int(elapsed * 1000)
        result["error"] = None
    except Exception as exc:
        result["error"] = str(exc)
    return result


def main():
    parser = argparse.ArgumentParser(description="Run health checks for KOSTIN Parfums")
    parser.add_argument("--backend-url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--frontend-url", default="https://kostinparfums.com", help="Frontend URL")
    parser.add_argument("--timeout", type=int, default=5, help="Request timeout in seconds")
    args = parser.parse_args()

    results = []
    results.append(check_backend(args.backend_url, timeout=args.timeout))
    results.append(check_frontend(args.frontend_url, timeout=max(args.timeout, 10)))

    failed = [r for r in results if not r["ok"]]
    for r in results:
        print(r)

    if failed:
        print(f"Health check failed: {len(failed)}/{len(results)} checks failed")
        sys.exit(1)

    print("Health check passed")
    sys.exit(0)


if __name__ == "__main__":
    main()
