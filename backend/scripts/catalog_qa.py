import argparse
import asyncio
import os
import re
import struct
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    def load_dotenv(*_args: Any, **_kwargs: Any) -> bool:
        return False


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_REPORT_PATH = ROOT_DIR / "marketing" / "catalog-qa-report.md"
SHORTLIST_PATH = ROOT_DIR / "marketing" / "12-product-shortlist.md"


@dataclass
class IssueRow:
    product_id: str
    name: str
    brand: str
    is_shortlist: bool
    issues: List[str]
    priority_score: int


MOCK_PRODUCTS: List[Dict[str, Any]] = [
    {
        "_id": "mock-1",
        "name": "Erba Pura",
        "brand": "Xerjoff",
        "description": "Fresh fruity opening with a deep amber base.",
        "description_bg": "",
        "category": "perfumes",
        "price": 165.0,
        "gtin": "",
        "mpn": "",
        "image": "https://example.com/erba-pura.jpg",
        "is_active": True,
        "_mock_image_check": {"status": "too_small", "width": 420, "height": 420},
    },
    {
        "_id": "mock-2",
        "name": "Aventus",
        "brand": "Creed",
        "description": "Legendary masculine fragrance with pineapple and smoky woods.",
        "description_bg": "Луксозен аромат.",
        "category": "perfumes",
        "price": 180.0,
        "gtin": "1234567890123",
        "mpn": "CRD-AVT-100",
        "images": ["https://example.com/aventus.jpg"],
        "is_active": True,
        "_mock_image_check": {"status": "ok", "width": 1200, "height": 1200},
    },
    {
        "_id": "mock-3",
        "name": "Black Opium",
        "brand": "",
        "description": "Coffee, vanilla and white flowers.",
        "description_bg": None,
        "category": "",
        "price": 0,
        "currency": "usd",
        "gtin": "",
        "mpn": "",
        "image": "https://example.com/broken.jpg",
        "is_active": True,
        "_mock_image_check": {"status": "broken"},
    },
]


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def parse_shortlist(path: Path) -> List[Tuple[str, str]]:
    entries: List[Tuple[str, str]] = []
    if not path.exists():
        return entries

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 3:
            continue
        if cells[0] in {"№", "---"}:
            continue
        brand = normalize_text(cells[1])
        product = normalize_text(cells[2])
        if brand and product:
            entries.append((brand, product))
    return entries


def compact(value: str) -> str:
    return re.sub(r"[^a-zа-я0-9]+", " ", value.lower()).strip()


def is_shortlist_product(product: Dict[str, Any], shortlist: Sequence[Tuple[str, str]]) -> bool:
    brand = compact(normalize_text(product.get("brand")))
    name = compact(normalize_text(product.get("name")))
    if not brand or not name:
        return False
    for s_brand, s_product in shortlist:
        sb = compact(s_brand)
        sp = compact(s_product)
        if sb and sb in brand and sp and (sp in name or name in sp):
            return True
    return False


def has_only_english_description(product: Dict[str, Any]) -> bool:
    description = normalize_text(product.get("description"))
    description_bg = normalize_text(product.get("description_bg"))
    if not description or description_bg:
        return False
    latin = len(re.findall(r"[A-Za-z]", description))
    cyrillic = len(re.findall(r"[А-Яа-я]", description))
    return latin > 0 and cyrillic == 0


def parse_float(value: Any) -> Optional[float]:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def has_valid_eur_price(product: Dict[str, Any]) -> bool:
    price_eur = parse_float(product.get("price_eur"))
    price = parse_float(product.get("price"))
    currency = normalize_text(product.get("currency")).lower()

    if price_eur and price_eur > 0:
        return True
    if (not currency or currency == "eur") and price and price > 0:
        return True
    return False


def collect_image_urls(product: Dict[str, Any]) -> List[str]:
    urls: List[str] = []
    images = product.get("images")
    if isinstance(images, list):
        urls.extend([normalize_text(u) for u in images if normalize_text(u)])
    elif isinstance(images, str):
        urls.extend([u.strip() for u in re.split(r"[|,]", images) if u.strip()])

    legacy_image = normalize_text(product.get("image"))
    if legacy_image:
        urls.extend([u.strip() for u in re.split(r"[|,]", legacy_image) if u.strip()])

    deduped: List[str] = []
    seen = set()
    for url in urls:
        if url not in seen:
            deduped.append(url)
            seen.add(url)
    return deduped


def image_size_from_bytes(content: bytes) -> Optional[Tuple[int, int]]:
    if len(content) < 10:
        return None

    if content.startswith(b"\x89PNG\r\n\x1a\n") and len(content) >= 24:
        width, height = struct.unpack(">II", content[16:24])
        return width, height

    if content[:6] in (b"GIF87a", b"GIF89a"):
        width, height = struct.unpack("<HH", content[6:10])
        return width, height

    if content.startswith(b"\xff\xd8"):
        idx = 2
        data_len = len(content)
        while idx + 9 < data_len:
            if content[idx] != 0xFF:
                idx += 1
                continue
            marker = content[idx + 1]
            idx += 2
            if marker in (0xD8, 0xD9):
                continue
            if idx + 2 > data_len:
                break
            seg_len = struct.unpack(">H", content[idx:idx + 2])[0]
            if seg_len < 2 or idx + seg_len > data_len:
                break
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                if idx + 7 <= data_len:
                    height, width = struct.unpack(">HH", content[idx + 3:idx + 7])
                    return width, height
                break
            idx += seg_len

    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        chunk_type = content[12:16]
        if chunk_type == b"VP8X" and len(content) >= 30:
            width = 1 + int.from_bytes(content[24:27], "little")
            height = 1 + int.from_bytes(content[27:30], "little")
            return width, height
        if chunk_type == b"VP8 " and len(content) >= 30:
            width = struct.unpack("<H", content[26:28])[0] & 0x3FFF
            height = struct.unpack("<H", content[28:30])[0] & 0x3FFF
            return width, height
        if chunk_type == b"VP8L" and len(content) >= 25:
            b0, b1, b2, b3 = content[21:25]
            width = 1 + (((b1 & 0x3F) << 8) | b0)
            height = 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
            return width, height

    return None


def fetch_image_size(url: str, timeout: int = 10) -> Optional[Tuple[int, int]]:
    request = Request(url, headers={"User-Agent": "catalog-qa/1.0"})
    with urlopen(request, timeout=timeout) as response:
        content = response.read(512 * 1024)
    return image_size_from_bytes(content)


def check_images(product: Dict[str, Any], min_size: int) -> Optional[str]:
    mock_check = product.get("_mock_image_check")
    if isinstance(mock_check, dict):
        status = normalize_text(mock_check.get("status")).lower()
        width = mock_check.get("width")
        height = mock_check.get("height")
        if status == "broken":
            return "Счупена снимка (URL не се зарежда)."
        if status == "too_small":
            return f"Снимката е твърде малка ({width}x{height}, минимум {min_size}x{min_size})."
        return None

    urls = collect_image_urls(product)
    if not urls:
        return "Липсва снимка."

    found_too_small = False
    for url in urls:
        try:
            size = fetch_image_size(url)
            if not size:
                continue
            width, height = size
            if width >= min_size and height >= min_size:
                return None
            found_too_small = True
        except (HTTPError, URLError, TimeoutError, ValueError):
            continue
        except Exception:
            continue

    if found_too_small:
        return f"Снимката е твърде малка (под {min_size}x{min_size})."
    return "Счупена снимка (URL не се зарежда)."


def product_id_to_str(product: Dict[str, Any]) -> str:
    value = product.get("id", product.get("_id", ""))
    return normalize_text(value)


def find_issues_for_product(
    product: Dict[str, Any],
    shortlist: Sequence[Tuple[str, str]],
    min_bg_length: int,
    min_image_size: int,
) -> Optional[IssueRow]:
    issues: List[str] = []
    description_bg = normalize_text(product.get("description_bg"))

    if not description_bg:
        issues.append("Липсва българско описание.")
    elif len(description_bg) < min_bg_length:
        issues.append(f"Българското описание е твърде кратко ({len(description_bg)} символа, минимум {min_bg_length}).")

    if has_only_english_description(product):
        issues.append("Има само английско описание (по аналогия с преводния поток).")

    brand = normalize_text(product.get("brand"))
    if not brand:
        issues.append("Липсва марка (brand).")

    gtin = normalize_text(product.get("gtin") or product.get("ean") or product.get("barcode"))
    mpn = normalize_text(product.get("mpn"))
    if not gtin and not mpn:
        issues.append("Липсват идентификатори GTIN/MPN.")

    category = normalize_text(product.get("category"))
    if not category:
        issues.append("Липсва категория.")

    if not has_valid_eur_price(product):
        issues.append("Липсва валидна EUR цена.")

    image_issue = check_images(product, min_size=min_image_size)
    if image_issue:
        issues.append(image_issue)

    if not issues:
        return None

    shortlist_flag = is_shortlist_product(product, shortlist)
    score = len(issues) * 10 + (100 if shortlist_flag else 0)
    critical_markers = ("Липсва българско описание", "само английско", "Счупена снимка", "Липсва валидна EUR цена")
    score += sum(5 for issue in issues if any(marker in issue for marker in critical_markers))

    return IssueRow(
        product_id=product_id_to_str(product),
        name=normalize_text(product.get("name")) or "Без име",
        brand=brand or "Без марка",
        is_shortlist=shortlist_flag,
        issues=issues,
        priority_score=score,
    )


async def load_products_from_db(limit: int) -> List[Dict[str, Any]]:
    load_dotenv()
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise RuntimeError("Липсват MONGO_URL и/или DB_NAME за режим с база данни.")

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("Липсва motor. Инсталирайте зависимостите за backend.") from exc

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    query = {"$or": [{"is_active": True}, {"is_active": {"$exists": False}}]}
    projection = {
        "_id": 1,
        "name": 1,
        "brand": 1,
        "description": 1,
        "description_bg": 1,
        "category": 1,
        "price": 1,
        "price_eur": 1,
        "currency": 1,
        "gtin": 1,
        "ean": 1,
        "barcode": 1,
        "mpn": 1,
        "image": 1,
        "images": 1,
        "is_active": 1,
    }

    cursor = db.products.find(query, projection=projection)
    if limit > 0:
        cursor = cursor.limit(limit)
    products = await cursor.to_list(length=max(limit, 1) if limit > 0 else None)
    client.close()
    return products


def build_report(
    *,
    products: List[Dict[str, Any]],
    issue_rows: List[IssueRow],
    shortlist: Sequence[Tuple[str, str]],
    output_path: Path,
    generated_at: datetime,
) -> str:
    issue_rows_sorted = sorted(issue_rows, key=lambda row: row.priority_score, reverse=True)
    shortlist_issues = [row for row in issue_rows_sorted if row.is_shortlist]
    english_only_count = sum(1 for row in issue_rows_sorted for issue in row.issues if "само английско описание" in issue)

    lines: List[str] = []
    lines.append("# QA одит на каталожните данни")
    lines.append("")
    lines.append(f"- Дата: {generated_at.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append(f"- Общо одитирани активни продукти: **{len(products)}**")
    lines.append(f"- Продукти с поне един проблем: **{len(issue_rows_sorted)}**")
    lines.append(f"- Продукти само с английско описание: **{english_only_count}**")
    lines.append("")
    lines.append("## Приоритизация преди пускане на кампанията")
    lines.append("Първо се коригират 12-те продукта от shortlist-а, дори когато част от останалите имат сходни проблеми.")
    lines.append("")

    shortlist_products_in_catalog = []
    for brand, product_name in shortlist:
        matched = None
        for product in products:
            if compact(brand) in compact(normalize_text(product.get("brand"))) and compact(product_name) in compact(normalize_text(product.get("name"))):
                matched = product
                break
        shortlist_products_in_catalog.append((brand, product_name, matched))

    for idx, (brand, product_name, matched_product) in enumerate(shortlist_products_in_catalog, start=1):
        if not matched_product:
            lines.append(f"{idx}. **{brand} {product_name}** — Не е открит сред активните продукти (проверка за наличност).")
            continue
        row = next((r for r in issue_rows_sorted if r.product_id == product_id_to_str(matched_product)), None)
        if row:
            lines.append(f"{idx}. **{brand} {product_name}** — Критично: {', '.join(row.issues)}")
        else:
            lines.append(f"{idx}. **{brand} {product_name}** — Няма QA проблеми по текущите критерии.")

    lines.append("")
    lines.append("## Таблица с проблемите по продукт")
    lines.append("")
    lines.append("| Приоритет | Shortlist | Продукт | ID | Проблеми |")
    lines.append("|---|---|---|---|---|")

    if not issue_rows_sorted:
        lines.append("| Нисък | Не | Няма проблемни продукти | — | — |")
    else:
        for row in issue_rows_sorted:
            priority_label = "Критичен" if row.priority_score >= 120 else ("Висок" if row.priority_score >= 40 else "Среден")
            shortlist_label = "Да" if row.is_shortlist else "Не"
            product_label = f"{row.brand} {row.name}".strip()
            issues_text = "; ".join(row.issues)
            lines.append(f"| {priority_label} | {shortlist_label} | {product_label} | {row.product_id or '—'} | {issues_text} |")

    lines.append("")
    lines.append("## Обобщение по тип проблем")
    lines.append("")
    issue_counter: Dict[str, int] = {}
    for row in issue_rows_sorted:
        for issue in row.issues:
            issue_counter[issue] = issue_counter.get(issue, 0) + 1
    if issue_counter:
        for issue, count in sorted(issue_counter.items(), key=lambda item: item[1], reverse=True):
            lines.append(f"- **{issue}**: {count}")
    else:
        lines.append("- Няма открити проблеми.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    report = "\n".join(lines) + "\n"
    output_path.write_text(report, encoding="utf-8")
    return report


async def run_catalog_qa(
    *,
    use_db: bool,
    output_path: Path,
    min_bg_length: int,
    min_image_size: int,
    limit: int,
) -> Tuple[int, int]:
    shortlist = parse_shortlist(SHORTLIST_PATH)
    products = await load_products_from_db(limit=limit) if use_db else MOCK_PRODUCTS

    issue_rows: List[IssueRow] = []
    for product in products:
        row = find_issues_for_product(
            product,
            shortlist=shortlist,
            min_bg_length=min_bg_length,
            min_image_size=min_image_size,
        )
        if row:
            issue_rows.append(row)

    build_report(
        products=products,
        issue_rows=issue_rows,
        shortlist=shortlist,
        output_path=output_path,
        generated_at=datetime.now(timezone.utc),
    )
    return len(products), len(issue_rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Каталожен QA одит за активни продукти.")
    parser.add_argument(
        "--use-db",
        action="store_true",
        help="Чете активните продукти от MongoDB вместо mock данни.",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_REPORT_PATH),
        help="Път до markdown репорта.",
    )
    parser.add_argument(
        "--min-bg-length",
        type=int,
        default=80,
        help="Минимална дължина на българското описание.",
    )
    parser.add_argument(
        "--min-image-size",
        type=int,
        default=500,
        help="Минимална ширина/височина на снимка.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Ограничава броя продукти при режим с база данни (0 = без лимит).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = Path(args.output).resolve()
    total, with_issues = asyncio.run(
        run_catalog_qa(
            use_db=args.use_db,
            output_path=output_path,
            min_bg_length=args.min_bg_length,
            min_image_size=args.min_image_size,
            limit=args.limit,
        )
    )
    print(f"QA одитът приключи: {with_issues}/{total} продукта с проблеми.")
    print(f"Репорт: {output_path}")


if __name__ == "__main__":
    main()
