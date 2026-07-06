#!/usr/bin/env python3
"""Daily Meta ad set monitoring for the first 5 days."""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Dict, Iterable, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


CTR_THRESHOLD = 1.2
CPM_THRESHOLD = 9.0
CPA_THRESHOLD = 28.0
ATC_THRESHOLD = 9.0


@dataclass
class DailyMetrics:
    date: str
    adset_name: str
    ctr: float
    cpm: float
    cpa: Optional[float]
    atc_rate: Optional[float]
    roas: Optional[float]
    spend: float


def _to_float(value: Any, default: Optional[float] = None) -> Optional[float]:
    if value in (None, ""):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _format_metric(value: Optional[float], suffix: str = "") -> str:
    if value is None:
        return "няма данни"
    return f"{value:.2f}{suffix}".replace(".", ",")


def _extract_action_value(items: Iterable[Dict[str, Any]], action_types: Iterable[str]) -> Optional[float]:
    action_types_set = set(action_types)
    for item in items or []:
        if item.get("action_type") in action_types_set:
            parsed = _to_float(item.get("value"))
            if parsed is not None:
                return parsed
    return None


def _parse_row(row: Dict[str, Any]) -> DailyMetrics:
    ctr = _to_float(row.get("ctr"), 0.0) or 0.0
    cpm = _to_float(row.get("cpm"), 0.0) or 0.0
    spend = _to_float(row.get("spend"), 0.0) or 0.0

    actions = row.get("actions") or []
    cost_per_action = row.get("cost_per_action_type") or []
    purchase_roas = row.get("purchase_roas") or []

    inline_clicks = _to_float(row.get("inline_link_clicks"), 0.0) or 0.0
    atc_count = _extract_action_value(actions, ("add_to_cart", "omni_add_to_cart")) or 0.0
    purchase_count = _extract_action_value(actions, ("purchase", "omni_purchase"))

    cpa = _extract_action_value(cost_per_action, ("purchase", "omni_purchase"))
    if cpa is None and purchase_count and purchase_count > 0:
        cpa = spend / purchase_count

    atc_rate = None
    if inline_clicks > 0:
        atc_rate = (atc_count / inline_clicks) * 100

    roas = _extract_action_value(purchase_roas, ("purchase", "omni_purchase"))

    return DailyMetrics(
        date=row.get("date_start", "неизвестна дата"),
        adset_name=row.get("adset_name", "Неименуван ad set"),
        ctr=ctr,
        cpm=cpm,
        cpa=cpa,
        atc_rate=atc_rate,
        roas=roas,
        spend=spend,
    )


def _sample_rows() -> List[Dict[str, Any]]:
    return [
        {
            "date_start": "2026-07-01",
            "adset_name": "TOFU - Entry Luxury",
            "ctr": "0.94",
            "cpm": "10.25",
            "spend": "146.30",
            "inline_link_clicks": "210",
            "actions": [
                {"action_type": "add_to_cart", "value": "14"},
                {"action_type": "purchase", "value": "4"},
            ],
            "cost_per_action_type": [{"action_type": "purchase", "value": "36.58"}],
            "purchase_roas": [{"action_type": "purchase", "value": "2.10"}],
        },
        {
            "date_start": "2026-07-01",
            "adset_name": "MOFU - Visitors 24h",
            "ctr": "1.38",
            "cpm": "8.40",
            "spend": "98.20",
            "inline_link_clicks": "165",
            "actions": [
                {"action_type": "add_to_cart", "value": "18"},
                {"action_type": "purchase", "value": "5"},
            ],
            "cost_per_action_type": [{"action_type": "purchase", "value": "19.64"}],
            "purchase_roas": [{"action_type": "purchase", "value": "3.85"}],
        },
        {
            "date_start": "2026-07-02",
            "adset_name": "BOFU - Cart Retargeting",
            "ctr": "1.55",
            "cpm": "7.85",
            "spend": "115.00",
            "inline_link_clicks": "130",
            "actions": [
                {"action_type": "add_to_cart", "value": "9"},
                {"action_type": "purchase", "value": "3"},
            ],
            "cost_per_action_type": [{"action_type": "purchase", "value": "38.33"}],
            "purchase_roas": [{"action_type": "purchase", "value": "2.95"}],
        },
    ]


def _build_alerts(metric: DailyMetrics) -> List[str]:
    alerts: List[str] = []

    if metric.ctr < CTR_THRESHOLD:
        alerts.append(
            "CTR е под 1,2%. Препоръка: смени слабите креативи и тествай нов hook + първи кадър."
        )

    if metric.cpm > CPM_THRESHOLD:
        alerts.append(
            "CPM е над 9 EUR. Препоръка: смени слабите креативи и намали припокриването на аудитории."
        )

    if metric.cpa is not None and metric.cpa > CPA_THRESHOLD:
        alerts.append(
            "CPA е над 28 EUR. Препоръка: стегни interest stacks и изключи най-слабите сегменти."
        )

    if metric.atc_rate is not None and metric.atc_rate < ATC_THRESHOLD:
        alerts.append(
            "ATC rate е под 9%. Препоръка: подобри продуктовата страница (доверие, доставка, CTA) и съответствието на креатив/оферта."
        )

    return alerts


def _group_by_date(metrics: List[DailyMetrics]) -> Dict[str, List[DailyMetrics]]:
    grouped: Dict[str, List[DailyMetrics]] = {}
    for metric in metrics:
        grouped.setdefault(metric.date, []).append(metric)
    return grouped


def _default_period() -> tuple[str, str]:
    end_date = date.today()
    start_date = end_date - timedelta(days=4)
    return start_date.isoformat(), end_date.isoformat()


def fetch_meta_insights(
    access_token: str,
    ad_account_id: str,
    api_version: str,
    start_date: str,
    end_date: str,
) -> List[Dict[str, Any]]:
    base_url = f"https://graph.facebook.com/{api_version}/act_{ad_account_id}/insights"
    params = {
        "access_token": access_token,
        "level": "adset",
        "time_increment": "1",
        "limit": "500",
        "fields": "date_start,adset_name,ctr,cpm,spend,inline_link_clicks,actions,cost_per_action_type,purchase_roas",
        "time_range": json.dumps({"since": start_date, "until": end_date}),
    }

    rows: List[Dict[str, Any]] = []
    next_url = f"{base_url}?{urlencode(params)}"

    while next_url:
        with urlopen(next_url) as response:  # nosec B310 - Meta Graph URL is fixed domain
            payload = json.loads(response.read().decode("utf-8"))
            rows.extend(payload.get("data", []))
            next_url = payload.get("paging", {}).get("next")

    return rows


def generate_report(rows: List[Dict[str, Any]], data_source_label: str, start_date: str, end_date: str) -> str:
    metrics = [_parse_row(row) for row in rows]
    grouped = _group_by_date(metrics)

    lines: List[str] = []
    lines.append("Дневен Meta мониторинг за първите 5 дни")
    lines.append(f"Период: {start_date} до {end_date}")
    lines.append(f"Източник на данни: {data_source_label}")
    lines.append("=" * 58)

    for day in sorted(grouped.keys()):
        lines.append(f"\nДата: {day}")
        for metric in sorted(grouped[day], key=lambda item: item.adset_name):
            lines.append(f"- Ad set: {metric.adset_name}")
            lines.append(
                "  CTR: "
                + _format_metric(metric.ctr, "%")
                + " | CPM: "
                + _format_metric(metric.cpm, " EUR")
                + " | CPA: "
                + _format_metric(metric.cpa, " EUR")
            )
            lines.append(
                "  ATC rate: "
                + _format_metric(metric.atc_rate, "%")
                + " | ROAS: "
                + _format_metric(metric.roas, "x")
                + " | Разход: "
                + _format_metric(metric.spend, " EUR")
            )

            alerts = _build_alerts(metric)
            if alerts:
                for alert in alerts:
                    lines.append(f"  АЛЪРТ: {alert}")
            else:
                lines.append("  Статус: всички прагове са в норма за този ad set.")

    if not metrics:
        lines.append("\nНяма върнати редове от Meta за избрания период.")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Meta monitoring report for first 5 days")
    parser.add_argument("--dry-run", action="store_true", help="Force dry-run with sample data")
    parser.add_argument("--start-date", help="Start date in YYYY-MM-DD")
    parser.add_argument("--end-date", help="End date in YYYY-MM-DD")
    args = parser.parse_args()

    default_start, default_end = _default_period()
    start_date = args.start_date or os.environ.get("META_MONITOR_START_DATE", default_start)
    end_date = args.end_date or os.environ.get("META_MONITOR_END_DATE", default_end)

    access_token = os.environ.get("META_ACCESS_TOKEN", "")
    ad_account_id = os.environ.get("META_AD_ACCOUNT_ID", "")
    api_version = os.environ.get("META_GRAPH_API_VERSION", "v21.0")

    rows: List[Dict[str, Any]]
    data_source_label: str

    should_use_dry_run = args.dry_run or not (access_token and ad_account_id)

    if should_use_dry_run:
        rows = _sample_rows()
        data_source_label = "dry-run примерни данни"
    else:
        try:
            rows = fetch_meta_insights(access_token, ad_account_id, api_version, start_date, end_date)
            data_source_label = "Meta Insights API"
        except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            rows = _sample_rows()
            data_source_label = f"dry-run примерни данни (fallback след API грешка: {error})"

    report = generate_report(rows, data_source_label, start_date, end_date)
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
