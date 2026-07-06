from datetime import datetime, timezone
import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "catalog_qa.py"
SPEC = importlib.util.spec_from_file_location("catalog_qa", MODULE_PATH)
assert SPEC and SPEC.loader
catalog_qa = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(catalog_qa)

build_report = catalog_qa.build_report
find_issues_for_product = catalog_qa.find_issues_for_product
parse_shortlist = catalog_qa.parse_shortlist


def test_parse_shortlist_has_12_entries():
    shortlist_path = Path(__file__).resolve().parents[2] / "marketing" / "12-product-shortlist.md"
    entries = parse_shortlist(shortlist_path)
    assert len(entries) == 12


def test_detects_english_only_description_issue():
    row = find_issues_for_product(
        {
            "_id": "p1",
            "name": "Erba Pura",
            "brand": "Xerjoff",
            "description": "Fresh fruity opening with a deep amber base.",
            "description_bg": "",
            "category": "perfumes",
            "price": 165.0,
            "gtin": "",
            "mpn": "",
            "image": "https://example.com/erba.jpg",
            "_mock_image_check": {"status": "ok", "width": 900, "height": 900},
        },
        shortlist=[("Xerjoff", "Erba Pura")],
        min_bg_length=80,
        min_image_size=500,
    )
    assert row is not None
    assert any("само английско описание" in issue for issue in row.issues)


def test_build_report_contains_priority_section(tmp_path):
    output = tmp_path / "catalog-qa-report.md"
    product = {
        "_id": "p1",
        "name": "Erba Pura",
        "brand": "Xerjoff",
        "description": "Fresh fruity opening with a deep amber base.",
        "description_bg": "",
        "category": "perfumes",
        "price": 165.0,
        "gtin": "",
        "mpn": "",
        "image": "https://example.com/erba.jpg",
        "_mock_image_check": {"status": "too_small", "width": 320, "height": 320},
    }
    row = find_issues_for_product(
        product,
        shortlist=[("Xerjoff", "Erba Pura")],
        min_bg_length=80,
        min_image_size=500,
    )
    assert row is not None

    build_report(
        products=[product],
        issue_rows=[row],
        shortlist=[("Xerjoff", "Erba Pura")],
        output_path=output,
        generated_at=datetime.now(timezone.utc),
    )

    text = output.read_text(encoding="utf-8")
    assert "QA одит на каталожните данни" in text
    assert "Приоритизация преди пускане на кампанията" in text
    assert "Xerjoff Erba Pura" in text
