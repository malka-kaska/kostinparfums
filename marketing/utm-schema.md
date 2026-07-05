# UTM схема и атрибуция — Kostin Parfums

## Цел

Всяка платена кампания в Meta (Facebook и Instagram) трябва да носи стандартизирани UTM параметри, за да може реалният ROAS (Return on Ad Spend) да се сравнява директно с отчетите в Meta Ads Manager. При завършена поръчка UTM параметрите се записват в базата данни към документа на поръчката.

---

## Стандартна UTM схема за Meta кампании

| Параметър       | Стойност / шаблон              | Описание                                                                 |
|-----------------|-------------------------------|--------------------------------------------------------------------------|
| `utm_source`    | `facebook` или `instagram`    | Мрежата, от която идва кликът                                            |
| `utm_medium`    | `paid_social`                 | Тип медия — платена социална реклама                                     |
| `utm_campaign`  | `{{campaign.name}}`           | Динамична стойност — попълва се автоматично от Ads Manager               |
| `utm_content`   | `{{ad.name}}`                 | Идентификатор на конкретната реклама (за A/B тестване на криейтиви)      |
| `utm_term`      | `{{adset.name}}`              | Идентификатор на рекламния набор (адсет) — таргетиращата аудитория       |

> **Забележка:** `{{campaign.name}}`, `{{ad.name}}` и `{{adset.name}}` са динамични параметри на Meta Ads Manager. Те се попълват автоматично при кликане върху рекламата.

---

## URL шаблони за Ads Manager

### Facebook реклами

```
https://kostinparfums.com/?utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

### Instagram реклами

```
https://kostinparfums.com/?utm_source=instagram&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

### Пример за конкретна целева страница (продукт)

```
https://kostinparfums.com/product/OUD-ELITE?utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

---

## Примери с реални стойности

| utm_source  | utm_medium   | utm_campaign            | utm_content               | utm_term                  |
|-------------|--------------|-------------------------|---------------------------|---------------------------|
| `facebook`  | `paid_social`| `summer_launch_2025`    | `carousel_oud_elite_v1`   | `lookalike_purchasers_bg` |
| `instagram` | `paid_social`| `dubai_collection_q3`   | `reel_fragrance_story`    | `interests_luxury_bg`     |
| `facebook`  | `paid_social`| `retargeting_cart`      | `dynamic_product_ad`      | `cart_abandoners_30d`     |
| `instagram` | `paid_social`| `womens_day_promo`      | `static_banner_rose_oud`  | `women_25_44_sofia`       |

---

## Конвенции за именуване

- Имената са **само с малки букви**, думите са разделени с `_` (долна черта).
- `utm_campaign` следва шаблона: `{тема}_{сезон_или_събитие}_{година}`.
- `utm_content` следва шаблона: `{формат}_{продукт_или_тема}_{версия}`.
- `utm_term` следва шаблона: `{тип_аудитория}_{детайл}_{пазар}`.
- Не се използват интервали, главни букви или специални символи.

---

## Технически поток (Frontend → Backend)

1. **Landing page** — при зареждане на сайта `App.js` извиква `captureUtm()` от `frontend/src/utils/utmTracker.js`.
2. **Съхранение** — UTM параметрите се записват в `sessionStorage` с ключ `utm_params` (принципът „първото докосване" — съществуващите стойности не се презаписват).
3. **Checkout** — при изпращане на поръчка (наложен платеж или карта) Checkout компонентът прочита UTM параметрите чрез `getStoredUtm()` и ги включва в заявката към backend-а.
4. **Backend** — UTM параметрите се записват в документа на поръчката в колекция `orders` под ключ `utm_params`.

### Структура на `utm_params` в MongoDB

```json
{
  "utm_params": {
    "utm_source": "facebook",
    "utm_medium": "paid_social",
    "utm_campaign": "summer_launch_2025",
    "utm_content": "carousel_oud_elite_v1",
    "utm_term": "lookalike_purchasers_bg"
  }
}
```

---

## Как да настроите URL в Meta Ads Manager

1. Отворете **Ads Manager → Campaigns → Ad Set → Ad**.
2. В секция **Website URL** поставете:
   ```
   https://kostinparfums.com/?utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
   ```
3. Кликнете **Build a URL parameter** ако предпочитате визуалния редактор — въведете стойностите ръчно в съответните полета.
4. Проверете с **Preview** дали URL-ът е правилно форматиран преди публикуване.

---

## Верификация

Критерий за успех: поръчка, направена след клик с UTM параметри, съдържа полето `utm_params` в MongoDB колекция `orders`.

За проверка изпълнете в MongoDB:

```javascript
db.orders.find(
  { "utm_params.utm_source": "facebook" },
  { order_number: 1, "utm_params": 1, created_at: 1 }
).sort({ created_at: -1 }).limit(10)
```

---

## Свързани документи

- [`meta-ads-campaign.md`](./meta-ads-campaign.md) — структура на кампаниите
- [`creative-briefs-bg.md`](./creative-briefs-bg.md) — криейтив брифове
- [`30-day-optimization-calendar.md`](./30-day-optimization-calendar.md) — оптимизационен календар
