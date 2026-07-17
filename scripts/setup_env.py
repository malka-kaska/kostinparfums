#!/usr/bin/env python3
"""
Validate required environment variables for KOSTIN Parfums backend.
Exits 0 if all good, otherwise prints missing vars and exits 1.
"""

import os
import sys


REQUIRED_VARS = [
    "MONGO_URL",
    "DB_NAME",
    "FRONTEND_URL",
    "JWT_SECRET",
    "ADMIN_PASSWORD",
]

META_VARS = [
    "META_APP_ID",
    "META_APP_SECRET",
    "META_PAGE_ID",
    "META_INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "META_ACCESS_TOKEN",
    "META_CATALOG_ID",
    "META_AD_ACCOUNT_ID",
]


def main():
    missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
    if missing:
        print("Missing required env vars:", ", ".join(missing))
        sys.exit(1)

    missing_meta = [v for v in META_VARS if not os.environ.get(v)]
    if missing_meta:
        print("Missing Meta env vars:", ", ".join(missing_meta))
        print("Meta features will be disabled until these are set.")

    print("Environment validation passed.")
    sys.exit(0)


if __name__ == "__main__":
    main()
