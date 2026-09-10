/* HAVOX product-image fallback
   Force the known local product assets after products are rendered. */
(() => {
  const FALLBACK_IMAGES = {
    1: '/images/straw-hat-gear-5.png',
    2: '/images/toji-fushiguro.png',
    3: '/images/travis-scot.png',
    4: '/images/destiny-forged.png'
  };

  const fixImage = (img) => {
    if (!(img instanceof HTMLImageElement)) return;
    const product = img.closest('.product');
    const id = Number(product?.querySelector('[data-add]')?.dataset.add || '');
    const fallback = FALLBACK_IMAGES[id];
    if (!fallback) return;

    if (img.dataset.havoxFixed !== '1') {
      img.dataset.havoxFixed = '1';
      img.addEventListener('error', () => {
        img.src = fallback;
      }, { once: true });
    }

    // Always use the known local asset instead of the API's image field.
    if (img.src !== new URL(fallback, window.location.href).href) {
      img.src = fallback;
    }
  };

  const scan = () => {
    document.querySelectorAll('.product-image img, .cart-item img').forEach(fixImage);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();