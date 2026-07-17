// KOSTIN Quick Share - popup logic (MV3, no secrets shipped).
const SHARE = {
  fb: (url, text) =>
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(url) +
    "&quote=" +
    encodeURIComponent(text),
  // Instagram has no public web sharer; open the composer and copy the caption.
  ig: () => "https://www.instagram.com/",
};

const DEFAULT_CAPTION =
  "KOSTIN — луксозни аромати за всеки ден. 🔗 Пазарувай на kostinparfums.com";

function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs && tabs[0] ? tabs[0] : null);
    });
  });
}

async function init() {
  const tab = await getActiveTab();
  const url = tab && tab.url ? tab.url : "";
  const isKostin = url.indexOf("kostinparfums.com") !== -1;

  // Pull detected product info from the page (set by content.js) if present.
  let productName = "";
  let productImg = "";
  if (isKostin && tab.id != null) {
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__kostinProduct || null,
      });
      const data = res && res.result;
      if (data) {
        productName = data.name || "";
        productImg = data.img || "";
      }
    } catch (e) {
      /* ignore */
    }
  }

  const preview = document.getElementById("preview");
  if (productImg) {
    preview.src = productImg;
  } else {
    preview.src = chrome.runtime.getURL("assets/product-1.png");
  }

  const productEl = document.getElementById("product");
  productEl.textContent = productName
    ? productName
    : isKostin
    ? "Продукт от KOSTIN Parfums"
    : "Отвори страница на продукт в kostinparfums.com";

  const caption = document.getElementById("caption");
  caption.value = productName
    ? `${productName} — KOSTIN Parfums. 🔗 Пазарувай на kostinparfums.com`
    : DEFAULT_CAPTION;

  const shareUrl = isKostin ? url : "https://kostinparfums.com";

  document.getElementById("fb").addEventListener("click", () => {
    const target = SHARE.fb(shareUrl, caption.value);
    chrome.tabs.create({ url: target });
    setStatus("Отворен Facebook споделящ прозорец.");
  });

  document.getElementById("ig").addEventListener("click", () => {
    navigator.clipboard.writeText(caption.value).then(() => {
      chrome.tabs.create({ url: SHARE.ig() });
      setStatus("Текстът е копиран — постави го в Instagram.");
    });
  });

  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(caption.value).then(() => {
      setStatus("Текстът е копиран в клипборда.");
    });
  });
}

init();
