// KOSTIN Quick Share - content script (runs on kostinparfums.com).
// Exposes detected product info to the popup via window.__kostinProduct.
(function () {
  function detect() {
    const name =
      (document.querySelector("h1") && document.querySelector("h1").innerText.trim()) ||
      (document.querySelector('[class*="product-name"]') &&
        document.querySelector('[class*="product-name"]').innerText.trim()) ||
      document.title;
    const img =
      (document.querySelector("img.product-image, .product img, img[alt]") &&
        (document.querySelector("img.product-image, .product img, img[alt]").src)) ||
      "";
    return { name: name, img: img };
  }
  window.__kostinProduct = detect();
})();
