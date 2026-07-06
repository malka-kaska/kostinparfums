# GDPR Consent Checklist — Meta Pixel & Conversions API

## Контекст

Магазинът **kostinparfums.com** използва Meta Pixel (ID: `2118783192346725`) и Meta Conversions API (CAPI) за проследяване на рекламни реализации. Тъй като сайтът оперира в България и ЕС, всяка форма на маркетингово проследяване изисква **изрично предварително съгласие** съгласно GDPR (Регламент ЕС 2016/679) и Закона за електронните съобщения.

---

## 1. Cookie Consent банер

| Елемент | Статус | Описание |
|---|---|---|
| Банерът е видим при първо посещение | ✅ | `CookieBanner.jsx` се показва след 1 s при липса на запазен избор |
| Категории: Задължителни / Аналитични / Маркетингови | ✅ | Три отделни тогъла в разширения изглед |
| Бутон „Приеми всички" | ✅ | Активира всички категории |
| Бутон „Само задължителни" | ✅ | Деактивира аналитични и маркетингови |
| Бутон „Настрой" | ✅ | Позволява гранулиран избор |
| По подразбиране маркетинговите са изключени | ✅ | `marketing: false` при зареждане |
| Meta Pixel се зарежда **само** след `marketing: true` | ✅ | `metaPixel.js → initializeMetaPixel()` |
| Съгласието се запазва в `localStorage` | ✅ | ключ `cookie_consent` + `cookie_consent_date` |
| Дата на съгласие се записва | ✅ | ISO 8601 timestamp |

---

## 2. Meta Pixel — активиране само след съгласие

```
Посетител зарежда сайта
       │
       ▼
App.js useEffect → initFromStoredConsent()
       │
       ├─ cookie_consent.marketing === true  → initializeMetaPixel() ──► fbq('init') + fbq('track','PageView')
       │
       └─ липса на запис / marketing === false → Pixel НЕ се зарежда
              │
              ▼
        CookieBanner се показва
              │
              ├─ Потребителят приема маркетингови → saveConsent({ marketing: true }) → initializeMetaPixel()
              │
              └─ Потребителят отхвърля → Pixel НЕ се зарежда
```

**Изпълнен критерий:** `fbevents.js` и `fbq('init')` се извикват **само и единствено** след изрично `marketing: true` в съгласието.

---

## 3. Съхранение на съгласието

| Поле | Стойност | Пример |
|---|---|---|
| Ключ | `cookie_consent` | `{"essential":true,"analytics":false,"marketing":true}` |
| Дата | `cookie_consent_date` | `"2026-07-05T14:32:10.000Z"` |
| Хранилище | `localStorage` | Остава при затваряне на браузъра |
| Срок на валидност | Препоръчан 12 месеца | Банерът се показва отново след изтичане |

### Препоръчана проверка за изтекло съгласие

В `CookieBanner.jsx` е препоръчително да се добави логика, която показва банера отново след 12 месеца:

```js
const consentDate = localStorage.getItem('cookie_consent_date');
if (consentDate) {
  const ageMs = Date.now() - new Date(consentDate).getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (ageMs > oneYear) {
    localStorage.removeItem('cookie_consent');
    localStorage.removeItem('cookie_consent_date');
    setIsVisible(true);
  }
}
```

---

## 4. Право на оттегляне на съгласие

Потребителят може да оттегли съгласието си по следните начини:

1. **Чрез Cookie банера** — при повторно посещение или чрез линк „Управление на бисквитки" в Footer-а.
2. **Чрез имейл** — contact@kostinparfums.com (отговор в рамките на 30 дни).
3. **Директно в браузъра** — изтриване на `localStorage` ключовете `cookie_consent` и `cookie_consent_date`.

> **Важно:** При оттегляне на маркетинговото съгласие Meta Pixel вече е зареден за текущата сесия. Промяната влиза в сила при следващо зареждане на страницата, тъй като `fbevents.js` не поддържа динамично деинициализиране. Данни, изпратени преди оттеглянето, не могат да бъдат изтрити от сървърите на Meta — за изтриване потребителят трябва да се свърже с Meta директно.

---

## 5. Limited Data Use (LDU) — настройка за CCPA/US

Meta предоставя опция **Limited Data Use (LDU)**, която ограничава обработката на данни на потребители от Калифорния и щати с приложимо законодателство.

### Активиране чрез Pixel (frontend)

```js
fbq('init', PIXEL_ID, {}, { 'limited_data_use': true });
```

### Активиране чрез CAPI (backend — препоръчан подход)

В payload-а на всяко CAPI събитие се добавя:

```json
{
  "data_processing_options": ["LDU"],
  "data_processing_options_country": 1,
  "data_processing_options_state": 1000
}
```

Или за автоматично определяне по IP адреса на потребителя:

```json
{
  "data_processing_options": ["LDU"],
  "data_processing_options_country": 0,
  "data_processing_options_state": 0
}
```

**Препоръка:** Добавете LDU флага в `backend/routes/meta_capi.py` при изграждане на payload-а на събитията.

---

## 6. Обработвани данни и правно основание

| Данни | Правно основание | Хеширане |
|---|---|---|
| IP адрес (Pixel) | Съгласие (чл. 6(1)(a) GDPR) | Не |
| User-Agent (Pixel) | Съгласие | Не |
| `_fbp` cookie | Съгласие | Не |
| `fbclid` параметър | Съгласие | Не |
| Имейл адрес (CAPI) | Съгласие | SHA-256 |
| Телефон (CAPI) | Съгласие | SHA-256 |
| Стойност на поръчка (CAPI) | Договор / Съгласие | Не |
| Идентификатор на поръчка (CAPI) | Договор / Съгласие | Не |

**Получател на данните:** Meta Platforms Ireland Ltd., 4 Grand Canal Square, Dublin 2, Ирландия.

**Механизъм за предаване извън ЕИП:** Стандартни договорни клаузи (SCC) + допълнителни мерки съгласно Решение 2021/914/ЕС.

---

## 7. Контролен списък преди пускане на кампания

- [ ] Тест: Отвори сайта в режим „инкогнито" → Meta Pixel **не трябва** да изпраща заявки към `connect.facebook.net` без съгласие (провери с DevTools → Network)
- [ ] Тест: Приеми маркетингови бисквитки → Pixel трябва да се зареди и да изпрати `PageView`
- [ ] Тест: Откажи / прие само задължителни → Pixel **не трябва** да се зарежда
- [ ] Тест: Презареди страницата след дадено маркетингово съгласие → Pixel трябва да се зареди автоматично (от `initFromStoredConsent()`)
- [ ] Политиката за бисквитки и Политиката за поверителност споменават Meta Pixel/CAPI
- [ ] Линк към „Политика за бисквитки" е достъпен от Footer и Cookie банера
- [ ] LDU флагът е конфигуриран в CAPI backend
- [ ] Дата на съгласие се записва за одит

---

## 8. Полезни ресурси

- [Meta — Business Tools Terms](https://www.facebook.com/legal/technology_terms)
- [Meta — Conversions API документация](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Meta — Limited Data Use](https://developers.facebook.com/docs/marketing-apis/data-processing-options)
- [EDPB — Насоки за бисквитки](https://edpb.europa.eu/our-work-tools/documents/public-consultations/2020/guidelines-052020-consent-under-regulation_en)
- [CNIL — Препоръки за Consent Mode](https://www.cnil.fr/en/google-analytics-and-data-transfers-united-states-cnil-orders-website-operator-comply)
