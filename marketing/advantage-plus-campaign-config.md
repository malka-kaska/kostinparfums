# Advantage+ Catalog кампания — конфигурация като код

## Цел и бюджет
- Общ месечен бюджет: **3500 EUR**
- Цел: **Sales (каталог)**
- Атрибуция: **7 дни клик + 1 ден преглед**

## Структура на кампанията (5 ад сета)

| Ад сет | Роля | Месечен бюджет | Дял | Bidding |
|---|---|---:|---:|---|
| Студено проспектиране Advantage+ Catalog | Нов трафик и нови клиенти | 1400 EUR | 40% | Automated bidding |
| Ретаргетинг посетители 24 ч | Връщане на скорошни посетители | 875 EUR | 25% | Cost cap към минимален ROAS |
| Количка/Checkout спасяване | Завършване на поръчки | 700 EUR | 20% | Min ROAS 4.0 |
| Минали купувачи | Повторни покупки и лоялност | 350 EUR | 10% | Min ROAS 5.0 |
| Редакторски Carousel A/B | Тест на креативни концепции | 175 EUR | 5% | Automated bidding |

## Общи настройки за всички ад сетове
- Позиции: **Advantage+ автоматични позиции** (Facebook, Instagram, Reels, Messenger)
- Държави: **BG, RO, GR, CY, HR, RS**
- Езици: **български и английски**
- Оптимизация: **Purchase/Value** според фазата и типа аудитория
- Статус при създаване: **PAUSED**

## Скрипт и артефакти
Скриптът `scripts/meta_create_campaign.py`:
- работи в **dry-run режим по подразбиране**;
- използва креденшъли **само от променливи на средата**;
- генерира валидни JSON payload-и на ниво:
  - campaign
  - adset
  - ad
- записва файловете в `marketing/payloads/`.
- изчислява дневния бюджет като `месечен бюджет / 30`, закръглен до евроцент.

## Необходими env променливи
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`
- `META_CATALOG_ID`
- `META_PAGE_ID`
- `META_PIXEL_ID` (препоръчително)
- `META_INSTAGRAM_ACTOR_ID` (препоръчително)

## Изпълнение
```bash
python3 scripts/meta_create_campaign.py
```

По желание реално извикване към Meta API (без dry-run):
```bash
python3 scripts/meta_create_campaign.py --execute
```
