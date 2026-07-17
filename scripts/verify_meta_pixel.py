from pathlib import Path
import subprocess
import sys

repo = Path("/Users/Ghost/kostinparfums.com")
results = {"python_compile": {}, "meta_pixel_route": {}, "server_registration": {}}

p = repo / "backend/routes/meta_pixel.py"
r = subprocess.run(
    [sys.executable, "-m", "py_compile", str(p)],
    capture_output=True,
    text=True,
)
results["python_compile"]["backend/routes/meta_pixel.py"] = {
    "ok": r.returncode == 0,
    "stderr": r.stderr.strip()[:200],
}

text = (repo / "backend/routes/meta_pixel.py").read_text()
results["meta_pixel_route"] = {
    "exists": p.exists(),
    "has_event_endpoint": '@router.post("/event"' in text,
    "has_health_endpoint": '@router.get("/health"' in text,
    "has_purchase_event_default": "Purchase" in text,
}

server_text = (repo / "backend/server.py").read_text()
results["server_registration"] = {
    "has_meta_pixel_import": "from routes.meta_pixel import router as meta_pixel_router" in server_text,
    "has_meta_pixel_include": "app.include_router(meta_pixel_router)" in server_text,
}

print(results)
