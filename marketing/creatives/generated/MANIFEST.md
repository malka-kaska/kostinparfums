# KOSTIN Parfums — Генерирани креативи (Summer Collection кампания)

Източник на съдържанието: вътрешни файлове в `/Users/Ghost/kostinparfums/marketing/`:
- `creatives/daily-stories-30d-bg.md` — 30-дневен IG/FB Stories календар
- `content/social/facebook/launch-posts.md` — FB постове (carousel 1200×1200, 1200×1500, 1080×1080, 1200×628 ad)
- `creative-briefs-bg.md` — 5 Meta креатив брифа (TOFU/MOFU/BOFU/AUTH/PRICE)
- `summer_products.json` — 39 извлечени продукта от летната колекция

Генератор: Higgsfield MCP (generate_image, model nano_banana_pro/2, 2k). Файлове в `marketing/creatives/generated/`.

## Статус
| Креатив | Файл | Базиран на | Размер | Статус |
|---|---|---|---|---|
| IG Story Ден 1 — Тийзър (Erba Pura) | ig_stories/day1_erba_pura_teaser.png | daily-stories Ден 1 Кадър 1 | 9:16 | ✅ |
| IG Story Ден 1 — Представяне | ig_stories/day1_erba_pura_reveal.png | daily-stories Ден 1 Кадър 2 | 9:16 | ✅ |
| IG Story Ден 3 — Куиз | ig_stories/day3_quiz.png | daily-stories Ден 3 | 9:16 | ✅ |
| IG Story Ден 4 — Съвет нанасяне | ig_stories/day4_tip.png | daily-stories Ден 4 | 9:16 | ✅ |
| IG Story Ден 5 — Уикенд оферта | ig_stories/day5_weekend_offer.png | daily-stories Ден 5 | 9:16 | ✅ |
| IG Story Ден 6 — Анкета нотки | ig_stories/day6_poll.png | daily-stories Ден 6 | 9:16 | ✅ |
| IG Story Ден 7 — Ревюта | ig_stories/day7_reviews.png | daily-stories Ден 7 | 9:16 | ✅ |
| Meta TOFU — Top luxury | meta_briefs/tofu_top_luxury.png | creative-briefs #1 | 1.91:1 | ✅ |
| Meta MOFU — Everyday | meta_briefs/mofu_everyday.png | creative-briefs #2 | 4:5 | ✅ (реген) |
| Meta BOFU — Cart | meta_briefs/bofu_cart.png | creative-briefs #3 | 1.91:1 | ✅ |
| Meta AUTH — Authentic | meta_briefs/auth_authentic.png | creative-briefs #4 | 1:1 | ✅ |
| Meta PRICE — Gift | meta_briefs/price_gift.png | creative-briefs #5 | 4:5 | ✅ |
| FB Launch — Brand | fb_ads/launch_brand_1200.png | launch-posts Post 01 | 1:1 | ✅ |
| FB Spotlight | fb_ads/spotlight_1200x1500.png | launch-posts Post 02 | 4:5 | ✅ |
| FB Cart Reminder | fb_ads/cart_reminder_1200x628.png | launch-posts Post 04 | 1.91:1 | ✅ |

## Видео / UGC (BLOCKED — кредити)
- Higgsfield `generate_video` (model `marketing_studio_video`, UGC preset) е напълно свързан и тестван чрез cost preflight: **60 кредита за 12s 9:16 видео**.
- Изхарчени досега: ~30 кредита (15 изображения × 2). Остатък: недостатъчен за видео.
- **БЛОКИРАНО:** изисква добавяне на кредити в Higgsfield (нужни ~60+ за 1 UGC reel, ~120 за 2).
- Готов pipeline: `hf_mcp_client.py` → `generate_video(prompt, model="marketing_studio_video", aspect="9:16", duration=12)` + `job_status`.

## UTM (от utm-schema.md)
IG Stories: `?utm_source=instagram&utm_medium=stories&utm_campaign=30d-calendar&utm_content=dayN`
FB Ads: `?utm_source=facebook&utm_medium=paid_social&utm_campaign={{name}}&utm_content={{ad.name}}`
