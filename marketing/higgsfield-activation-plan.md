# Higgsfield Marketing Activation — KOSTIN Parfums

Status: started from the recovered Gemini/Higgsfield agent session.

## Context recovered from prior agent chat

The previous agent cloned and audited the repository, then stopped because the Higgsfield CLI had no selected workspace. The pasted session later shows the user selected the `KOSTIN` workspace manually after quitting the agent. A billable Higgsfield image generation was started in this continuation session for a generic KOSTIN hero banner.

Generated/pending asset:

- `596fffa2-2b4d-420d-84f0-4725f0146a5d` — 16:9 luxury KOSTIN hero banner, generic unbranded perfume silhouettes, black/white/gold aesthetic, no fake brand labels.

## Repository facts used

Source: `memory/PRD.md`

- Platform: React 18 + FastAPI + MongoDB.
- Market: Bulgaria only.
- Payments: Stripe + Cash on Delivery.
- Shipping: Speedy Bulgaria integration.
- Images: Cloudinary.
- Marketing/catalog: Meta Catalog API integration.
- Shopping UX: best sellers, recently viewed, smart autocomplete, dark/light mode, BG/EN.

Source: `marketing/12-product-shortlist.md`

Priority product set:

1. Xerjoff Erba Pura
2. Xerjoff Erba Pura Gold
3. Xerjoff Naxos
4. Creed Aventus
5. Parfums de Marly Delina
6. Parfums de Marly Herod
7. Tom Ford Black Orchid Parfum
8. Christian Dior Sauvage Elixir
9. Christian Dior J'adore EDP
10. Chanel Chance Tendre
11. YSL Black Opium
12. Montale Aoud Night

## Recommended direction

Do **not** rewrite the whole website into a new Higgsfield/TanStack app yet. The current store already has working commerce infrastructure. The highest-value next step is to use Higgsfield for:

1. Hero / landing visuals.
2. Meta ad creatives.
3. UGC-style product videos.
4. Social carousel assets.
5. Seasonal campaign visuals.

## Brand kit draft

Brand name: KOSTIN Parfums

Website: https://kostinparfums.com/

Business overview:

KOSTIN Parfums is a Bulgarian luxury fragrance e-commerce store selling original niche and designer perfumes. The brand positioning is premium, clean, authentic and modern, with emphasis on trust, originality, delivery within Bulgaria and high-end fragrance discovery.

Short description:

Original luxury perfumes in Bulgaria — niche and designer fragrances with premium presentation and local delivery.

Tagline options:

- Established to endure.
- Original fragrance. Lasting impression.
- Luxury scents, delivered in Bulgaria.

Colors:

- Black `#000000` — luxury, contrast, editorial backgrounds.
- White `#ffffff` — clean premium layout and negative space.
- Warm gold `#d4a574` — accent, luxury signal, CTA highlights.

Typography:

- Montserrat or close geometric sans-serif.
- Uppercase headings with wide letter spacing.
- Minimal body copy, strong product names.

Tone of voice:

- Premium, confident, concise.
- Avoid cheap-discount language.
- Emphasize originality, scent character, occasion and gift value.
- Bulgarian-first, with English variants for bilingual site/social copy.

Visual aesthetics:

- Black/white/gold luxury.
- Editorial perfume photography.
- Soft spotlight, marble, glass reflections.
- Clean negative space.
- Avoid fake or inaccurate brand logos.
- For real branded perfumes, use actual supplied/approved product images as reference, not AI-invented labels.

## Higgsfield asset generation prompts

### 1. Homepage hero banner

Mode: image / Marketing Studio Image
Aspect ratio: 16:9

Prompt:

> Luxury perfume e-commerce hero banner for KOSTIN Parfums, a Bulgarian online boutique selling original high-end niche and designer fragrances. Minimal black-and-white composition with subtle warm gold accent, Montserrat-style premium typography feeling but no visible text, elegant glass perfume bottles as generic unbranded silhouettes, marble and soft spotlight reflections, premium editorial product photography, clean negative space for website headline, sophisticated, authentic luxury, no fake brand logos, no readable labels.

### 2. Meta ad square creative

Mode: image / Marketing Studio Image
Aspect ratio: 1:1

Prompt:

> Premium square Meta ad creative for KOSTIN Parfums. A refined arrangement of luxury perfume bottles as unbranded silhouettes on black marble, soft gold reflection, high-end editorial lighting, clean negative space for offer text, Bulgarian luxury e-commerce mood, authentic original perfumes, no readable labels, no fake designer logos.

### 3. Instagram story visual

Mode: image / Marketing Studio Image
Aspect ratio: 9:16

Prompt:

> Vertical Instagram Story ad for KOSTIN Parfums, cinematic close-up of elegant perfume atomizer mist in warm spotlight, black background, subtle gold particles, marble reflection, premium fragrance discovery mood, clean top and bottom space for Bulgarian text overlay, no readable labels, no fake logos.

### 4. UGC-style video concept

Mode: Marketing Studio Video / UGC or Unboxing

Script direction:

> Creator receives a clean black KOSTIN package, opens it, shows the fragrance bottle packaging carefully, describes the feeling of ordering original luxury perfume in Bulgaria, highlights delivery and gift value, ends with close-up of the perfume on a marble surface and a simple CTA: “Открий своя аромат в KOSTIN.”

Bulgarian narration:

> Ако търсиш оригинален парфюм, който изглежда и се усеща като истински подарък, KOSTIN е точно това. Подбрани нишови и дизайнерски аромати, премиум усещане и доставка в България. Открий своя аромат в KOSTIN.

English narration:

> If you want an original fragrance that feels like a real gift, KOSTIN is made for that. Curated niche and designer perfumes, premium presentation, delivered in Bulgaria. Discover your scent with KOSTIN.

## MakeUGC flow to use

Reference supplied by user:

https://app.makeugc.ai/ai-flows/028418e1-8cab-4b07-bb17-e1d0fd53abc7

Use this as the UGC flow reference if the MakeUGC/Higgsfield environment has access to it. If direct URL import fails, recreate the flow manually with:

- Preset: UGC or Unboxing.
- Product/site: KOSTIN Parfums.
- Hook: “This feels like opening a luxury gift.”
- Setting: clean bedroom vanity or marble desk with soft daylight.
- CTA: “Открий своя аромат в KOSTIN.”

## Website integration notes

Once a generated image has a final URL:

1. Upload it to Cloudinary or store in the project asset pipeline.
2. Add it to the homepage hero section.
3. Keep live copy short:

Bulgarian:

> Оригинални нишови и дизайнерски парфюми. Подбрани аромати с премиум усещане и доставка в България.

English:

> Original niche and designer fragrances. Curated luxury scents with premium presentation and delivery in Bulgaria.

4. Do not use AI-generated fake brand labels for specific Dior/Chanel/Xerjoff/etc. products. For SKU pages and Meta catalog, use real supplier/approved product images.

## Next implementation steps

1. Wait for Higgsfield hero image job `596fffa2-2b4d-420d-84f0-4725f0146a5d` to complete and retrieve the final image URL.
2. Generate 1:1 Meta ad and 9:16 Story variants from the prompts above.
3. Use MakeUGC flow or recreate it as UGC/Unboxing if URL import is unavailable.
4. Add generated assets to homepage/marketing folders.
5. Create a small campaign page/collection for the 12 priority products.
