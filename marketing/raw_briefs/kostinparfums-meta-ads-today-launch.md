# KOSTIN Parfums — Днешен пуск: Meta Ads кампания
## Дата: 2026-07-06
## Източник: `/Users/Ghost/kostinparfums-meta-ads-campaign.md` + 10 subagent deliverables

---

# Преговор на наличните ресурси преди старт
- ✅ `claude-fable-5` via `copilot-acp`: enrouter и работещ
- ✅ `copilot --acp`, `copilot --agent`, `copilot mcp`, `--enable-all-github-mcp-tools`, `--allow-all`
- ✅ Hermes skill: `lux-fragrance-meta-ads-launch`
- ✅ 12 продуктов shortlist, 10 trend сигнали, budget, аудитории, креативи, копирайт, Pixel/CAPI, feed checklist, optimization calendar
- ⚠️ `cua-driver`/macOS computer-use не са налични днес; продължаваме без desktop controller
- ⚠️ `iTerm2` не е инсталиран; използваме стандартен Terminal.app

---

# Днешни tasks и exact actions

## Task 1 — Pixel + CAPI инсталация и тестване
**Приоритет:** висок
**Срок:** Ден 1
1. Влез в **Meta Events Manager**.
2. Добави Pixel на домейна `kostinparfums.com`.
3. Установи събитията със следните имена:
   - `ViewContent`
   - `Search`
   - `AddToWishlist` (custom)
   - `AddToCart`
   - `InitiateCheckout`
   - `Purchase`
   - `Lead`
   - `CompleteRegistration`
   - `ViewCategory` (custom)
   - `DiscountApplied` (custom)
4. Тествай всяко събитие с **Test Events** preview.
5. Ако използваш CAPI, свържи същото събитие и от backend.

**Завършено кога:** всички 10 events отчитат тестови тригери.

## Task 2 — продуктов фийд/каталог
**Приоритет:** висок
**Срок:** Ден 1–2
1. Генерирай продуктов фийд в **EUR**.
2. Включи задължителните полета:
   - `id`, `title`, `description`, `availability`, `condition: New`, `price`, `link`, `image_link`, `brand`, `gtin` (ако има), `mpn` (ако има)
3. Добави custom labels:
   - категория
   - best-seller ранг
   - eligibility за безплатна доставка
4. Снимкови правила: чист фон, минимум 100x100 px.
5. Качи фийда в **Meta Catalog** и провери синхронизация.
6. Настрой синхронизация: **real-time** или минимум **2 пъти дневно**.

**Завършено кога:** фийдът е одобрен, availability/цени се sync-ват без грешки.

## Task 3 — Advantage+ Catalog кампания + Carousel за редакторски колекции
**Приоритет:** висок
**Срок:** Ден 2–3
1. Създай кампания тип **Advantage+ Catalog**.
2. Бюджетно разпределение от deliverables:
   - Хладно Adv+: €1,400/мес
   - РетаргетING 24h: €875/мес
   - Cart/Checkout: €700/мес
   - Минали купувачи: €350/мес
   - Редакторски Carousel A/B: €175/мес
3. Ако имаш вече 5 фази, стартирай всички едновременно.
4. За Carousel създай 3 ад sets:
   - **Top Sellers**
   - **Signature by Occasion**
   - **Dubai Collection**
   - По 2 креатива на collection.

**Завършено кога:** всички 5 фази са активни и показват показвания/кликове.

## Task 4 — Креативи + копирайт
**Приоритет:** среден
**Срок:** Ден 3–4
1. Готови 8 копирайтни шаблона + CTA map са в deliverables.
2. Подреди ги по креатив группы:
   - TOFU: 2 variants
   - MOFU: 2 variants
   - BOFU: 2 variants
   - UGC: 1 variant
   - Editorial: 2 variants
3. Качи всички в Ads Manager, свържи с правилните аудитории.

**Завършено кога:** 9 креативи са онлайн и получават трафик.

## Task 5 — Аудитории
**Приоритет:** среден
**Срок:** Ден 3
1. Въведи в Ads Manager следните interest stacks:
   - **Entry luxury:** Парфюми / Луксозни стоки / Козметика / Грим
   - **Aspirational men:** Мъжка мода / Дизайнерски марки / Премиум аксесоари / Груминг за мъже
   - **Dubai/Niche explorer:** Нишеви парфюми / Оуд парфюми / Арабски парфюми / Дубай / Пътуване в Дубай
2. За всеки stack: OR логика в рамките на stack-а, между stack-овете не смесвай.
3. Начален бюджет: сподели спрямо долните в бюджета.

**Завършено кога:** 3 adsets са насочени към изброените интереси.

## Task 6 — Първи 5 дни мониторинг
**Приоритет:** висок
**Срок:** Ден 5
1. Всеки ден проверявай:
   - CTR ≥ 1.2%
   - CPM ≤ €9
   - ATC Rate ≥ 9%
   - CPA ≤ €28
2. Ако CTR < 1.2% или CPM > €9 → смени слабите креативи.
3. Ако CPA > €28 → стегни interest stacks.

**Завършено кога:** първоначалните корекции са направени на база на реални данни.

---

# Референции към съществуващите файлове
- `/Users/Ghost/kostinparfums-meta-ads-campaign.md`
- `/Users/Gost/kostinparfums-12-product-shortlist.md`
- `/Users/Gost/kostinparfums-30-day-optimization-calendar.md`
