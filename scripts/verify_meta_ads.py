from pathlib import Path
import subprocess
import sys

repo = Path("/Users/Ghost/kostinparfums.com")
results = {"python_compile": {}, "meta_ads_route": {}, "server_registration": {}}

# 1) backend/routes/meta_ads.py compilation
p = repo / "backend/routes/meta_ads.py"
r = subprocess.run(
    [sys.executable, "-m", "py_compile", str(p)],
    capture_output=True,
    text=True,
)
results["python_compile"]["backend/routes/meta_ads.py"] = {
    "ok": r.returncode == 0,
    "stderr": r.stderr.strip()[:200],
}

# 2) backend/routes/meta_ads.py checks
text = (repo / "backend/routes/meta_ads.py").read_text()
results["meta_ads_route"] = {
    "exists": p.exists(),
    "has_audience_suggestions": '@router.get("/audience-suggestions"' in text,
    "has_campaign_draft": '@router.post("/campaigns/draft"' in text,
    "has_creative_draft": '@router.post("/creatives/draft"' in text,
    "has_adset_draft": '@router.post("/adsets/draft"' in text,
    "has_experiments_suggest": '@router.get("/experiments/suggest"' in text,
    "has_advantage_audience_default": "advantage_audience" in text,
    "has_advantage_placements_default": "advantage_placements" in text,
}

# 3) server.py registration check
server_text = (repo / "backend/server.py").read_text()
results["server_registration"] = {
    "has_meta_ads_import": "from routes.meta_ads import router as meta_ads_router" in server_text,
    "has_meta_ads_include": "app.include_router(meta_ads_router)" in server_text,
}

print(results)
