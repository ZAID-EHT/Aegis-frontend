"""Launch the AEGIS API in LIVE mode (reads .env, never prints secrets).

The API does not auto-load .env (see CAPTURE_SESSION.md). This launcher loads it the
same way scripts/seed_demo_users.py does, sets the LAN CORS origin, and starts uvicorn
bound to 0.0.0.0:8000 so the live 70-student cohort renders for shared-network preview.

Read-only by design: AEGIS_PERSIST is NOT set, so the live allocation is never
overwritten. Switch back to seed by running uvicorn without SUPABASE_URL.

    python scripts/run_api_live.py
"""

from __future__ import annotations

import os
import re
import sys

# Running as `python scripts/run_api_live.py` puts scripts/ on sys.path, not the
# project root — so the `aegis` package wouldn't import. Add the root explicitly.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _load_env(path: str = ".env") -> None:
    try:
        for line in open(path, encoding="utf-8"):
            m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2).split(" #")[0].strip()
    except FileNotFoundError:
        pass


def main() -> None:
    _load_env()
    if not os.environ.get("SUPABASE_URL"):
        raise SystemExit("SUPABASE_URL not set (in .env) — cannot start live mode.")
    # CORS for LAN/localhost is handled by a regex in aegis/api/main.py — no env needed.
    os.environ.pop("AEGIS_PERSIST", None)  # capture is read-only; never write back

    import uvicorn

    print("Starting AEGIS API in LIVE mode on 0.0.0.0:8000 (read-only)")
    uvicorn.run("aegis.api.main:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
