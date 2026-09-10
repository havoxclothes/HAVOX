/* HAVOX product-image fallback
   Ensures product images render even when /api/products returns a missing,
   relative, encoded, or incorrect image field. */
(() => {
  const FALLBACK_IMAGES = {
    1: '/images/straw-hat-gear-5.png',
    2: '/images/toji-fushiguro.png',
    3: '/images/travis-scot.png',
    4: '/images/destiny-forged.png'
  };

  const NAME_IMAGES = {
    'straw hat gear 5': FALLBACK_IMAGES[1],
    'toji fushiguro': FALLBACK_IMAGES[2],
    'travis scot': FALLBACK_IMAGES[3],
    'travis scott': FALLBACK_IMAGES[3],
    'destiny forged': FALLBACK_IMAGES[4]
  };

  const fallbackFor = (img) => {
    const id = Number(img.dataset.productId || img.closest('[data-product-id]')?.dataset.productId || '');
    if (FALLBACK_IMAGES[id]) return FALLBACK_IMAGES[id];
    const key = (img.alt || '').trim().toLowerCase();
    return NAME_IMAGES[key] || '';
  };

  const fixImage = (img) => {
    if (!(img instanceof HTMLImageElement)) return;
    const fallback = fallbackFor(img);
    if (!fallback) return;
    img.dataset.productId = img.dataset.productId || img.closest('.product')?.querySelector('[data-add]')?.dataset.add || '';
    const useFallback = () => {
      if (img.dataset.havoxFallbackApplied === '1') return;
      img.dataset.havoxFallbackApplied = '1';
      img.src = fallback;
    };
    img.addEventListener('error', useFallback, { once: true });
    if (!img.getAttribute('src')) useFallback();
  };

  const scan = () => document.querySelectorAll('.product-image img, .cart-item img').forEach(fixImage);
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();