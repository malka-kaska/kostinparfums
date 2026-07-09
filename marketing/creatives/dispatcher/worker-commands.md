# KOSTIN Parfums — MakeUGC / Antigravity / appmakeugc.ai Orchestrator Pack
_Status: dispatch-ready. Each worker below is a self-contained generation job with exact prompt, target platform, deliverable path, and approval rule._

---

## Контингент
| Роля | Ресурс | Отговорност |
|------|--------|-------------|
| Orchestrator | този файл | Раздели 30 creators, провери изходни dependency-та, визуализира статус |
| Worker A — Image/Video | `appmakeugc.ai` или `antigravity image/video` flow | Генерира PNG/JPG/MP4 за всеки ден спрямо `marketing/creatives/makeugc-creative-assets.md` |
| Worker B — Caption/Localization | български/английски copy | Адаптира caption seed-ове, добави хештегове и CTA вариации |
| Worker C — Asset QA | ImageMagick / ffprobe / браузър | Проверява формат, размер, цветови палитра, наличие на текст overlay |
| Worker D — Meta Upload | `appmakeugc.ai` SDK + META_ACCESS_TOKEN | Качи финализирани assets в Meta Ad Library через Assets API |
| Worker E — Git/Release | `git` + GitHub repo `malka-kaska/kostinparfums` | Commit/push на всички генерирани assets под `marketing/creatives/generated/` |

---

## Правила за стартиране на всеки worker
1. Не стартирай Worker A без Worker E да е създал output директорията.
2. Worker A използва **само** промптите от `marketing/creatives/makeugc-creative-assets.md`, без да променя copy без одобрение.
3. Worker B се стартира след първия batch от 7 дни, не преди.
4. Worker C sleeпе 2 секунди след всеки generated asset, после проверява aspect ratio, watermark, presence of URL.
5. Worker D изчаква одобрение от човека преди upload в Meta.
6. Всики линии с `[REDACTED]` се попълват локално от human, не от worker.

---

## Directory structure expected before any worker starts
```text
marketing/creatives/
├── makeugc-creative-assets.md
├── generated/
│   ├── day-01-07/
│   ├── day-08-14/
│   ├── day-15-21/
│   ├── day-22-30/
│   └── batch-manifest.json
└── dispatcher/
    └── worker-commands.md          ← този файл
```

---

## Worker commands
> Замести `MAKEUGC_API_KEY`, `META_ACCESS_TOKEN` и подобни с реални стойности локално. Не ги commit-вай.

### Worker E — Git/Release
```bash
cd /Users/Ghost/kostinparfums.com
mkdir -p marketing/creatives/generated/day-01-07
mkdir -p marketing/creatives/generated/day-08-14
mkdir -p marketing/creatives/generated/day-15-21
mkdir -p marketing/creatives/generated/day-22-30
touch marketing/creatives/generated/batch-manifest.json
git add marketing/creatives/
git commit -m "chore(marketing): prepare MakeUGC generated asset directories"
git push
```

### Worker A — Day 1–7 batch
- Source: `marketing/creatives/makeugc-creative-assets.md` entries Day 1–7
- Command shape via antigravity-cli:
```bash
agy prompt --print "
Използвай appmakeugc.ai промпатите от Day 1–7 от marketing/creatives/makeugc-creative-assets.md.
Генерирай всички visual assets и запази в marketing/creatives/generated/day-01-07/.
Не практикувай никакво модифициране на текст без явно одобрение."
```
- Falls back to manual provider if `MAKEUGC_API_KEY` is present.

### Worker A — Day 8–14 batch
- Source: Day 8–14 entries
- Output: `marketing/creatives/generated/day-08-14/`

### Worker A — Day 15–21 batch
- Source: Day 15–21 entries
- Output: `marketing/creatives/generated/day-15-21/`

### Worker A — Day 22–30 batch
- Source: Day 22–30 entries
- Output: `marketing/creatives/generated/day-22-30/`

### Worker B — Caption/Localization
- Source: Each Day caption seed from `makeugc-creative-assets.md`
- Deliverable: `marketing/creatives/generated/day-XX-YY/captions-bg.md` and `captions-en.md`
- Rule: keep brand voice, add CTA variants `Пазарувай сега` / `Shop Now`

### Worker C — Asset QA
```bash
cd /Users/Ghost/kostinparfums.com/marketing/creatives/generated
find . -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.mp4" \) -print0 | \
xargs -0 -I{} bash -lc '
  f="{}"
  echo "[QA] $f"
  if [[ "$f" == *.mp4 ]]; then
    ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f"
  else
    s=$(file "$f")
    echo "$s"
  fi
'
```

### Worker D — Meta Upload
- Required: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`, `META_INSTAGRAM_BUSINESS_ACCOUNT_ID`
- Command shape:
```bash
agy prompt --print "
Използвай appmakeugc.ai SDK за да качиш готовите assets от marketing/creatives/generated/ 
в Meta Ad Library чрез Assets API. Не стартирай без предварително одобрение."
```
- Gate: human approval required before any public upload.

---

## Бачендинг на release
1. Worker E създава директориите.
2. Sequentially run Worker A batches 1→4.
3. Worker B прави caption файлове след всеки batch.
4. Worker C проверява всеки batch преди следващ.
5. Worker D чака финален човешки approve.
6. Worker E commit/push на всички approved assets.

---

_Ако искаш, следваща стъпка е да пусна Worker E и да подготвя първата worker-worker dependency проверка._
