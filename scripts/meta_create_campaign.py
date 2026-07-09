#!/usr/bin/env python3
"""Meta Marketing API payload generator for Advantage+ catalog campaign."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any
from urllib import error, parse, request


MONTHLY_TOTAL_BUDGET_EUR = 3500
COUNTRIES = ["BG", "RO", "GR", "CY", "HR", "RS"]
LANGUAGES = ["bg", "en"]

ADSET_CONFIGS = [
    {
        "slug": "cold_advantage_plus_catalog",
        "name": "Студено проспектиране Advantage+ Catalog",
        "monthly_budget_eur": 1400,
        "bidding": {"mode": "AUTOMATED_BIDDING"},
    },
    {
        "slug": "retarget_visitors_24h",
        "name": "Ретаргетинг посетители 24 ч",
        "monthly_budget_eur": 875,
        "bidding": {
            "mode": "COST_CAP_THEN_MIN_ROAS",
            "notes": "Cost cap към минимален ROAS",
        },
    },
    {
        "slug": "cart_checkout_recovery",
        "name": "Количка/Checkout спасяване",
        "monthly_budget_eur": 700,
        "bidding": {"mode": "MIN_ROAS", "minimum_roas": 4.0},
    },
    {
        "slug": "past_buyers",
        "name": "Минали купувачи",
        "monthly_budget_eur": 350,
        "bidding": {"mode": "MIN_ROAS", "minimum_roas": 5.0},
    },
    {
        "slug": "editorial_carousel_ab",
        "name": "Редакторски Carousel A/B",
        "monthly_budget_eur": 175,
        "bidding": {"mode": "AUTOMATED_BIDDING"},
    },
]

AD_TEXTS = {
    "cold_advantage_plus_catalog": {
        "format": "CATALOG",
        "primary_text": "Открий оригинални луксозни аромати с бърза доставка в Европа.",
        "headline": "Пазарувай сега",
    },
    "retarget_visitors_24h": {
        "format": "CATALOG",
        "primary_text": "Върни се към избраните аромати и завърши поръчката си още днес.",
        "headline": "Завърши поръчката",
    },
    "cart_checkout_recovery": {
        "format": "CATALOG",
        "primary_text": "Парфюмите в количката те очакват. Завърши покупката сега.",
        "headline": "Вземи своя аромат",
    },
    "past_buyers": {
        "format": "CATALOG",
        "primary_text": "Благодарим за доверието. Открий нови предложения за следващ любим аромат.",
        "headline": "Разгледай новите предложения",
    },
    "editorial_carousel_ab": {
        "format": "CAROUSEL",
        "primary_text": "Селекция от редакторски фаворити за всеки повод.",
        "headline": "Виж селекцията",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Meta campaign payloads (dry-run by default)."
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Send payloads to Meta Marketing API.",
    )
    parser.add_argument(
        "--month-days",
        type=int,
        default=30,
        help="Days used for monthly -> daily budget conversion (default: 30).",
    )
    parser.add_argument(
        "--output-dir",
        default="marketing/payloads",
        help="Directory where JSON payloads are saved.",
    )
    parser.add_argument(
        "--campaign-name",
        default="KOSTIN Advantage+ Catalog EU",
        help="Campaign name.",
    )
    return parser.parse_args()


def get_env_value(name: str, fallback: str | None = None) -> str:
    value = os.getenv(name)
    if value:
        return value
    if fallback is not None:
        return fallback
    raise RuntimeError(
        f"Липсва env променлива: {name}. "
        "Виж нужните променливи в marketing/advantage-plus-campaign-config.md."
    )


def monthly_to_daily_cents(monthly_budget_eur: float, month_days: int) -> int:
    """Convert monthly EUR budget to daily cents with nearest-cent rounding."""
    daily_budget_in_eur = monthly_budget_eur / month_days
    return int(round(daily_budget_in_eur * 100))


def build_campaign_payload(campaign_name: str) -> dict[str, Any]:
    return {
        "name": campaign_name,
        "objective": "OUTCOME_SALES",
        "buying_type": "AUCTION",
        "status": "PAUSED",
        "is_advantage_plus": True,
        "special_ad_categories": [],
        "attribution_spec": [
            {"event_type": "CLICK_THROUGH", "window_days": 7},
            {"event_type": "VIEW_THROUGH", "window_days": 1},
        ],
        "meta_settings": {
            "placement": "Advantage+ automatic placements (IG/FB/Reels/Messenger)",
            "countries": COUNTRIES,
            "languages": LANGUAGES,
        },
        "budget": {
            "currency": "EUR",
            "monthly_total_eur": MONTHLY_TOTAL_BUDGET_EUR,
        },
    }


def build_adset_payloads(
    month_days: int, campaign_name: str, env_values: dict[str, str]
) -> list[dict[str, Any]]:
    payloads: list[dict[str, Any]] = []
    for config in ADSET_CONFIGS:
        payloads.append(
            {
                "name": config["name"],
                "slug": config["slug"],
                "campaign_name": campaign_name,
                "status": "PAUSED",
                "optimization_goal": "VALUE",
                "billing_event": "IMPRESSIONS",
                "targeting": {
                    "countries": COUNTRIES,
                    "languages": LANGUAGES,
                    "placement_mode": "ADVANTAGE_PLUS_AUTO",
                    "platforms": ["facebook", "instagram", "messenger", "reels"],
                },
                "promoted_object": {
                    "catalog_id": env_values["META_CATALOG_ID"],
                    "page_id": env_values["META_PAGE_ID"],
                    "pixel_id": env_values["META_PIXEL_ID"],
                },
                "budget": {
                    "currency": "EUR",
                    "monthly_budget_eur": config["monthly_budget_eur"],
                    "daily_budget_cents": monthly_to_daily_cents(
                        config["monthly_budget_eur"], month_days
                    ),
                    "daily_budget_rounding": (
                        "Месечен бюджет / дни, закръглен до най-близкия евроцент."
                    ),
                },
                "bidding": config["bidding"],
                "attribution": {"click_days": 7, "view_days": 1},
            }
        )
    return payloads


def build_ad_payloads(
    campaign_name: str, env_values: dict[str, str]
) -> list[dict[str, Any]]:
    payloads: list[dict[str, Any]] = []
    for config in ADSET_CONFIGS:
        texts = AD_TEXTS[config["slug"]]
        payloads.append(
            {
                "name": f"Реклама — {config['name']}",
                "campaign_name": campaign_name,
                "adset_slug": config["slug"],
                "status": "PAUSED",
                "creative": {
                    "format": texts["format"],
                    "primary_text": texts["primary_text"],
                    "headline": texts["headline"],
                    "description": "100% автентични парфюми и бърза доставка в ЕС.",
                    "call_to_action": "SHOP_NOW",
                    "page_id": env_values["META_PAGE_ID"],
                    "instagram_actor_id": env_values["META_INSTAGRAM_ACTOR_ID"],
                },
            }
        )
    return payloads


def write_payload(path: Path, payload: Any) -> None:
    serialized_payload = json.dumps(payload, ensure_ascii=False, indent=2)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        f.write(serialized_payload)


def post_to_meta(endpoint: str, payload: dict[str, Any], access_token: str) -> dict[str, Any]:
    data = parse.urlencode(payload).encode("utf-8")
    req = request.Request(endpoint, data=data, method="POST")
    req.add_header("Authorization", "Bearer " + access_token)
    with request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def execute_campaign_requests(
    env_values: dict[str, str], campaign_payload: dict[str, Any]
) -> None:
    account_id = env_values["META_AD_ACCOUNT_ID"]
    access_token = env_values["META_ACCESS_TOKEN"]
    base_url = "https://graph.facebook.com/v21.0"
    endpoint = f"{base_url}/act_{account_id}/campaigns"
    try:
        response = post_to_meta(endpoint, campaign_payload, access_token)
        print("Кампанията е изпратена успешно към Meta API.")
        print(json.dumps(response, ensure_ascii=False, indent=2))
    except error.HTTPError as http_err:
        body = http_err.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(body)
            meta_error = parsed.get("error", {})
            err_type = meta_error.get("type", "unknown")
            err_code = meta_error.get("code", "unknown")
            err_message = meta_error.get("message", "Неизвестна грешка.")
            raise RuntimeError(
                f"Грешка от Meta API ({http_err.code}) [{err_type}/{err_code}]: {err_message}"
            ) from http_err
        except json.JSONDecodeError:
            raise RuntimeError(
                f"Грешка от Meta API ({http_err.code}): невалиден формат на отговор."
            ) from http_err
    except error.URLError as url_err:
        raise RuntimeError(
            f"Мрежова грешка при връзка с Meta API: {url_err.reason}"
        ) from url_err


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parent.parent
    output_dir = (repo_root / args.output_dir).resolve()

    env_values = {
        "META_CATALOG_ID": get_env_value("META_CATALOG_ID", "<META_CATALOG_ID>"),
        "META_PAGE_ID": get_env_value("META_PAGE_ID", "<META_PAGE_ID>"),
        "META_PIXEL_ID": get_env_value("META_PIXEL_ID", "<META_PIXEL_ID>"),
        "META_INSTAGRAM_ACTOR_ID": get_env_value(
            "META_INSTAGRAM_ACTOR_ID", "<META_INSTAGRAM_ACTOR_ID>"
        ),
    }

    campaign_payload = build_campaign_payload(args.campaign_name)
    adset_payloads = build_adset_payloads(
        month_days=args.month_days,
        campaign_name=args.campaign_name,
        env_values=env_values,
    )
    ad_payloads = build_ad_payloads(
        campaign_name=args.campaign_name,
        env_values=env_values,
    )

    write_payload(output_dir / "campaign_payload.json", campaign_payload)
    write_payload(output_dir / "adsets_payload.json", adset_payloads)
    write_payload(output_dir / "ads_payload.json", ad_payloads)

    print(f"JSON payload файловете са записани в: {output_dir}")
    print("Режим:", "execute" if args.execute else "dry-run")

    if args.execute:
        env_values["META_ACCESS_TOKEN"] = get_env_value("META_ACCESS_TOKEN")
        env_values["META_AD_ACCOUNT_ID"] = get_env_value("META_AD_ACCOUNT_ID")
        execute_campaign_requests(env_values, campaign_payload)


if __name__ == "__main__":
    main()
