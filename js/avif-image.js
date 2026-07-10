(function () {
  function normalizePath(src) {
    let s = String(src || '').trim();
    if (s.startsWith('./')) s = s.slice(2);
    return s;
  }

  function encodePath(src) {
    return normalizePath(src)
      .split('/')
      .map((part) => encodeURIComponent(decodeURIComponent(part)))
      .join('/');
  }

  /** JPG/PNG fallback path (always exists on disk). */
  function fallbackSrc(src) {
    const s = normalizePath(src);
    if (/^logo\//i.test(s) || /\/logo\//i.test(s) || /\/logo\.(avif|webp)$/i.test(s)) {
      return s.replace(/\.(avif|webp)(\?.*)?$/i, '.png$2');
    }
    if (/favicon\.(avif|webp)$/i.test(s)) {
      return s.replace(/\.(avif|webp)(\?.*)?$/i, '.png$2');
    }
    return s.replace(/\.(avif|png|webp)(\?.*)?$/i, '.jpg$2');
  }

  function avifSrc(src) {
    return fallbackSrc(src).replace(/\.(jpe?g|png)(\?.*)?$/i, '.avif$2');
  }

  function picture(src, alt, options) {
    const opts = options || {};
    const fallback = fallbackSrc(src);
    const avif = avifSrc(fallback);
    const cls = opts.className ? ` class="${opts.className}"` : '';
    const loading = opts.loading || 'lazy';
    const decoding = opts.decoding || 'async';
    const fetchPriority = opts.fetchPriority ? ` fetchpriority="${opts.fetchPriority}"` : '';
    const safeAlt = String(alt || '').replace(/"/g, '&quot;');
    return (
      `<picture>` +
      `<source srcset="${encodePath(avif)}" type="image/avif">` +
      `<img src="${encodePath(fallback)}" alt="${safeAlt}"${cls} loading="${loading}" decoding="${decoding}"${fetchPriority}>` +
      `</picture>`
    );
  }

  function upgradeImg(img) {
    if (!img || img.closest('picture')) return;
    if (img.classList.contains('step-panel-img') || img.dataset.skipAvif === '1') return;
    const src = img.getAttribute('src');
    if (!src || /^https?:\/\//i.test(src)) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = picture(src, img.getAttribute('alt') || '', {
      className: img.className || '',
      loading: img.getAttribute('loading') || 'lazy',
      decoding: img.getAttribute('decoding') || 'async',
      fetchPriority: img.getAttribute('fetchpriority') || '',
    });
    const pictureEl = wrap.firstElementChild;
    const newImg = pictureEl.querySelector('img');
    [...img.attributes].forEach((attr) => {
      if (attr.name === 'src' || attr.name === 'alt') return;
      if (!newImg.hasAttribute(attr.name)) newImg.setAttribute(attr.name, attr.value);
    });
    img.replaceWith(pictureEl);
  }

  function upgradeAll(root) {
    (root || document)
      .querySelectorAll('img[src]:not(picture img)')
      .forEach(upgradeImg);
  }

  window.SayHomesAvif = {
    fallbackSrc,
    avifSrc,
    encodePath,
    picture,
    upgradeImg,
    upgradeAll,
  };
})();
