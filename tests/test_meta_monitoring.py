import importlib.util
from pathlib import Path
import sys


def _load_module():
    module_path = Path(__file__).resolve().parents[1] / "scripts" / "meta_monitoring.py"
    spec = importlib.util.spec_from_file_location("meta_monitoring", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_generate_report_dry_run_contains_bulgarian_alerts():
    module = _load_module()
    rows = module._sample_rows()
    report = module.generate_report(rows, "dry-run примерни данни", "2026-07-01", "2026-07-05")

    assert "Дневен Meta мониторинг за първите 5 дни" in report
    assert "АЛЪРТ" in report
    assert "Препоръка" in report
    assert "CTR" in report and "CPM" in report and "CPA" in report and "ATC rate" in report


def test_threshold_rules_trigger_expected_alerts():
    module = _load_module()
    metric = module.DailyMetrics(
        date="2026-07-05",
        adset_name="Test",
        ctr=0.9,
        cpm=10.2,
        cpa=35.0,
        atc_rate=7.0,
        roas=2.2,
        spend=100.0,
    )

    alerts = module._build_alerts(metric)

    assert any("CTR" in a for a in alerts)
    assert any("CPM" in a for a in alerts)
    assert any("CPA" in a for a in alerts)
    assert any("ATC" in a for a in alerts)
