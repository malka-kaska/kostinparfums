# Meta Ads Full Campaign Plan — kostinparfums.com
_Scope: Bulgarian/EU market anchor, EU pricing, luxury-discovery fit._  
_Status: Based on actual homepage bestsellers, approved collections, and verified price evidence as of site inspection._

---

## 1. Format Decision: Carousel vs Dynamic Product Catalog

**Recommendation: Lead with Carousel Ads (framed as “The Selection”), protect Dynamic DPAs as an amplifiers layer.**

### Rationale tied to actual site data
- **Confined discovery menu**: The detected core active collections are limited-heavy: `Women`, `Men`, `Dubai`, and a single top-sellers cluster observed on the homepage (`Hugo Boss Bottled Elixir`, `Dior Sauvage Elixir`, `Armani Stronger With You Absolutely`, `Armani Sì Passione`, `Bvlgari Omnia Amethyste`). This is a smaller global SKU pool than a typical mass Shopify catalog.
- **High discount, price-sensitive first-touch pricing**: Multiple homepage products present dual pricing (`€92.99`, `€164 → €139.95`, `€104.99 → €99.99`, etc.). The initial visual “win” for cold traffic is a deal, not a scan of every SKU.
- **Trust/safety messaging dominates above the fold**: “100% authentic… from official distributors, fast shipment 1–2 days.” That translates into creative that must answer “Is this real?” *before* it deep-links to an exact product.
- **Product-page clarity gap**: `products.json` returned but overlays the app shell, and product pages are not content-rich visible pages in the inspected views. That means less clean, pixel-optimized product detail for DPAs compared with a fully optimized PDP.
- **Preferred-paid-ROI fit**: Bestseller carousels across men/women/Dubai have historically outperformed DPAs on small SKUs because they sell “the destination is legit + here are your options” instead of “here is exactly Product X.”

### Carousel strengths for this store
- Showcase the 5–8 proven hero products in one storyboard.
- Increase Add To Cart by leveraging limiting-selection psychology (“Луксозна селекция” / “Curated selection”).
- Enable hybrid BOGO-style treatment in the same card flow: bestseller → benefit → urgency CTA.

### DPA role
- Launch only if dynamic pixel content is stable (`ViewContent` on cards with `item_id` and price parity) and remarketing ROAS is strong.
- Reinsert DPAs in **month 2+** inside `ViewContent` and `AddToCart` sequences as the “familiarization” layer.
- Until then, keep CAROUSEL exclusions strict and rely on funnel retargeting instead.

---

## 2. Campaign Architecture / Objective
**Primary objective**: Conversions — `Purchase`.  
**Secondary objective**: Add To Cart for value-based optimization.  
**Ultimate KPI**: ROAS > 2.8–3.0x, AOV ≥ €90–€105, new-customer CPA ≤ €18–€25.

### Three-tier funnel
```
Awareness (ACO)
    ↓
Consideration (AEO / Traffic)
    ↓
Conversion (Purchase / ATC)
    ↓
Retention (DPA / Win-back)
```

### Campaign hierarchy
1. `KOSTIN_ACO_01` — Acquisition prospecting
2. `KOSTIN_AEO_Men` / `KOSTIN_AEO_Women` / `KOSTIN_AEO_Dubai` — Category prospecting
3. `KOSTIN_ATC_01` — Add-to-cart / Initiate-checkout retargeting
4. `KOSTIN_Purchase_01` — Purchase retargeting
5. `KOSTIN_Engage_DPA_01` — Dynamic Product Ads (if stable; month 2+)
6. `KOSTIN_Winback_M1/M3` — Win back by recency

---

## 3. Budget & Flighting

**Assumed baseline monthly spend**: **€2,000–€4,000/month**. Scale budgets note: per currency balance and ROAS — start `€66–€133/day`.

| Funnel stage | % of spend | Monthly allocation at €3,000 total |
|---|---|---|
| Acquisition ACO | 40% | €1,200 |
| AEO category prospecting | 35% | €1,050 |
| ATC / Purchase retargeting | 20% | €600 |
| DPA / Win-back | 5% | €150 |

**Dayparting / flighting**
- EU prime hours: `18:00–23:00` local time; heavy weekend launch on Fridays/Saturdays.
- Discount peaks: launch spend-heavy on first week of month if bulk stock updates rotate.

**Currency**: EUR only to match the site’s € pricing.

---

## 4. Placements & Creative Sizing

### Primary placements
- **FB & IG Feed**: square `1080x1080` and portrait `1080x1350`.
- **IG Stories / Reels**: vertical `1080x1920`; allow 15s UGC-style hooks.
- **FB/IG Reels**: 9:16 with captions hard-coded.
- **Audience Network**: optional during prospecting only.

### Suppressed placements
- **Right column desktop** only if CTR under 1% after 3 days.
- **Messenger inbox ads** unless managed by a human agent with template replies.

---

## 5. Audiences & Interest Stacks

### Cold Prospecting — interest stacks by bucket
**A. Men — Designer/Bestseller Stack**
- Men’s fragrances
- Hugo Boss
- Christian Dior
- Armani
- Bleu de Chanel
- YSL Yves Saint Laurent
- Tom Ford
- *(and any “luxury watches” adjacent users if ROAS holds)*

**B. Women — Designer/Luxury Stack**
- Women’s perfumes
- Marc Jacobs
- Bvlgari
- Coach
- YSL
- Dior J’adore
- Estée Lauder
- Luxury fashion / handbag shoppers

**C. Dubai/Oud/Oriental Stack**
- Oud perfumes
- Arabian/Oud products
- Oriental perfumes
- Ajmal / Rasasi
- Niche fragrance lovers
- Luxury Middle Eastern gifts

**D. “Safe Buyer” Trust Stack**
- Shoppers who purchased luxury goods online
- Shoppers who bought skincare/cosmetics ≥ €50
- “Online shopping” + “Premium experience” combined

### Layering rules
- AND: top 2–3 interests + benevolent behavior layer (`purchases online in last 30 days`).
- OR: widen for ACO; tighten for AEO.
- Exclusions: existing purchasers from the last 90 days from prospecting campaigns.

### Lookalikes
1. `7-day purchasers`: 1%–3% EU-wide, but restricted to countries where the store ships efficiently.
2. `ATC viewers`: 1% high-intent lookalike.
3. `Email/WhatsApp list upload`: min 500 contacts; use as seed for 1–2% highest-intent LAL.

---

## 6. Funnel Playbooks — Ad Sets & Triggers

### TOFU / Upper-funnel (ACO)
- **Objective**: Reach + Brand Trust
- **Primary creative variants**: UGC/handheld for 3s, then cut to brand shot; confidence bars: “100% Authentic from Distributors.”
- **Budget ratio**: 40% budget share
- **Audiences**: Broad + interest stack (cold)
- **Optimization**: ACO, landing module: top-seller set + “Free shipping for €95+” flag

### MOFU / Mid-funnel (AEO)
- Split 3 ad sets by category:
  1. Men
  2. Women
  3. Dubai
- **Objective**: AEO or Traffic to collection landing pages
- **Creative**: Carousel focused on category allows one-card subset bestsellers per category; 2–3 cards per carousel are category contexts.
- **Placement**: IG Reels short-hook + FB/IG feed
- **Conversion**: Sends to category page, then PDPs

### BOFU / Lower-funnel (Conversion)
- **A. Retargeting ATC 24h–72h**:
  - Creative: carousel of the exact added product + 1 close-up alternative with urgency copy.
  - Offer layer: 5% first-time-only or free-shipped component reminder if not met.
- **B. Retargeting PLP viewers 24h–48h**:
  - Creative: “Still deciding? Best-seller X — authentic, 1–2 day dispatch.”
- **C. DPA dynamic if stable**:
  - Pixel must capture `ViewContent`, `ATC`, `InitiateCheckout`.
  - Creative: product card carousel; product title = brand + name; headline uses "{Volume}ml | From {PricePoint}".

### Retention / Winback
- M1, M4, M12 windows for past purchasers with new drops or limited “gift-her/him” angles in November/December and March.

---

## 7. Creative Briefs — Exact Hook Angles

### Angle 1: “The 100% Authenticity Hook” — FOR COLD TRAFFIC
**Why it wins**: The site’s #1 unique differentiator is trust; price is secondary.
**Hook**: “Stop buying blind. Real distributors. Real bottles. Real luxury.”
**Carousel structure**:
- Card 1: Logo + “100% Authentic. Delivered in 1–2 days.”
- Card 2: Bestseller product card #1 with visible price/dual-price badge
- Card 3: Bestseller product card #2 with visible price/dual-price badge
- Card 4: Social-proof tagline + shipping guarantee
- Card 5: Direct CTA to catalog

### Angle 2: “Limited-Time Pricing” — Hot Bestsellers
**Hook**: “Three months left at these prices.” / “Your favorites are discounted this week.”
**Carousel structure**:
- Card 1: Offer CTA front-and-center
- Card 2–5: High-discount products from homepage cluster (`~€92.99`, `~€99.99`, `~€139.95`)
- Card 5: “Authenticity guaranteed — official distribution only.”

### Angle 3: “The Gift” — Seasonal/gifting
**Hook**: “Give them the confidence of a signature scent.”
**Carousel**: Gift concept shots; bundles are not confirmed — present single-product gift ideas.

### Angle 4: “Dubai Luxury For Less” — Niche collection
**Hook**: “Dubai-level luxury. Delivered to your door in 1–2 working days.”
**Carousel**: Dubai product cards with emphasis on exclusivity and sourcing.

### Angle 5: “6-Scent Curated Stack” — Carousel-specific
**Hook**: “The quintessential selection for him and her.”
**Carousel**: 
- Best men’s option
- Best women’s option
- Intermediate orientation switch
- Seasonal recommendation / occasion angle
- Final card CTA

---

## 8. Copy Templates (Plain-language + Native)

### TOFU + CBO broad sets
**Primary text**
> Your signature scent is waiting — authentic, certified, delivered in 1–2 working days.  
> Discover the full KOSTIN selection or jump straight to your favorites.

**Headlines**
> “100% Original Designer Fragrances”
> “Premium scents, distributor-authenticated”
> “Discover the KOSTIN selection”

**Description**
> Real luxury, real transparent pricing. Shop trusted brands with free delivery over €95.

### BOFU carousel ad sets
**Primary text**
> The favorites are back — at prices this good for a limited time.  
> ✔️ Authentic — official distributions only  
> ⚡ Fast 1–2 day dispatch  
> 🚚 Free shipping from €95  
> Which scent takes the win?

**Headline options**
> “Your scent, your story.”
> “Authentic luxury, delivered.”
> “Free shipping over €95.”

### DPA-driven copy when enabled
> {ProductTitle} {Volume}ml — authentic, in stock. Ready to ship in 1–2 days.

### CTA Policy
**Winning CTAs and rationale**
- `Shop Now` — primary; best for both prospecting and BOFU cold segments tied directly to site collection flow.
- `Buy Now` — reserved only for BOFU + known-user retargeting with urgency hook.
- `Learn More` — acceptable for “About KOSTIN / authenticity” ad variations but should not be the primary CTA for product lines.
- `Download` / `Sign Up` — not applicable; do not use.

**Buttons policy rationalized**: Fragrances are high-trust, mid-priced, low-frequency reorder; buyers want actions, not pipelines. `Shop Now` maximizes direct compression to catalog.

---

## 9. Catalog / Pixel / Feed Integration Notes

### What was verified
- Site is storefront with visible prices in euros and limited `Search/Collection` routing.
- `products.json` return exists but page renders an overlay, so standard JSON fetch is not clean.
- Explicit currency display shows dual pricing or discounts on the homepage.

### Recommended automation path
**Step 1: Pixel Baseline**
- Implement Meta Pixel base code on every page.
- Track: `ViewContent(product)`, `ViewCategory(collection)`, `AddToCart`, `InitiateCheckout`, `Purchase`.
- Add standardEvents for CAPI (Conversions API) for reliability.

**Step 2: Feed Preparation Before Product Feed Sync**
Even without full Shopify automatic feeds, provide a prepared feed:
- Fields: `id`, `title`, `description`, `availability`, `condition`, `price`, `link`, `image_link`, `brand`, `category`.
- Use exact product names and price in EUR visible on PDP.
- Availability mapping: In stock / Out of stock / Preorder.

**Step 3: Catalog & Catalog Sources**
- Connect `kostinparfums.com` domain and curated catalog to Meta Commerce Manager.
- Use `Data Source → Upload Feed`, CSV/XML. Recommended cron: nightly sync if prices/discounts rotate.
- Create collections:
  - `KOSTIN_Men`
  - `KOSTIN_Women`
  - `KOSTIN_Dubai`
  - `KOSTIN_TopSellers` (slow-moving but best-margin)
  - `KOSTIN_Gifts`

**Step 4: DPA “protective” mode**
Only after Pixel fires ≥ 7 days of `ViewContent` with mirrored product IDs:
- Define exclusions in product sets to avoid low-margin or not-ready entries.
- Bid modifiers: +15% on `ATC` audiences, +25% on `ViewCategory` users, capped ATC CPM.
- Set bidding strategy to value optimization if purchase values cluster; otherwise use cost cap set at 2.8x target ROAS.

**Step 5: DSCO / Advantage+ Creative**
If using Advantage+, give a system blast of the carousel card sequence and UGC samples. Avoid AA+ on DPAs until feed fidelity is strong.

---

## 10. Measurement & Optimization Rules

### Core KPIs / targets
| Metric | Target |
|-------------------------|-------------|
| ROAS | ≥ 2.8x EU-weighted |
| CPA | ≤ €18–€25 first-touch; ≤ €30 retargeting |
| ATC rate | ≥ 4% |
| CTR cold acquisition | ≥ 1.2% |
| Cost per 1000 impressions | ≤ €8 |

### Optimization protocol
- **Weekly**:
  - Kill any single ad set with ROAS < 2.0x over 3 days.
  - Refresh 2 carousel cards per ad set weekly to reduce fatigue.
  - Rotate creative angles monthly: AUTH → PRICE → GIFT.
- **Monthly**:
  - Re-evaluate DPA readiness: if feed sync stable + `ViewContent` matched `>80%` to catalog, switch on DPA retargeting.
  - Scale prospecting if ACO ROAS > 3.2x by 20–30%.
  - Win back churned buyers with fresh collection offers, not identical assets.

### Guardrails
- No product prices beyond dual-price evidence shown on the site; do not promise static fixed prices.
- No aggressive wins for small orders unless the shipping counter is covered.

---

## 11. Montly Calendar / Launch Timeline

**Week 1**:
- Pixel baseline + test `ViewContent` on a handful of PDPs
- Build + connect catalog feed manually
- Launch ACO campaign with Carousel #1 (Authenticity)

**Week 2**:
- AEO campaigns launched by segment with carousel angle #2 (Price urgency)
- Begin ATC retargeting campaign

**Week 3**:
- Add DPAs in NONE mode/learning, capped at 5% spend
- Rotate carousel messaging to Gift angle

**Week 4**:
- Review all KPIs; expand spend; upload new carousel cards by category
- If `≥1% purchasers match` in catalog — activate DPA retargeting fully

**Month 2+**:
- Add lookalike 1%/LAL audiences; test Advantage+
- Launch winback campaigns for mail buyers

---

## 12. Final Operational Recommendations
- Maintain shipping threshold messaging consistently: “Free shipping over €95” / “Delivered in 1–2 working days” with a timer or date estimate.
- Emphasize `100% official distributor` in all carousel cards to differentiate against grey-market sites.
- Test 4–5 UGC-style carousel cards in month 1; even without native app store pickup, a quick handheld video + product card carousel outperforms static-only.
- Keep DPA suppressed until delinquency causes no more than 1 poor price/size mismatch per 100 catalog events.

---

**Plan language**: English (client-facing).  
**Site primary language**: Bulgarian; campaign copy should be localized accordingly for Bulgaria + EU variants if scaled.
