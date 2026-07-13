(function () {
  function isAbsoluteUrl(src) {
    return /^https?:\/\//i.test(String(src || '').trim());
  }

  function normalizePath(src) {
    let s = String(src || '').trim();
    if (s.startsWith('./')) s = s.slice(2);
    return s;
  }

  function encodePath(src) {
    if (isAbsoluteUrl(src)) return String(src).trim();
    return normalizePath(src)
      .split('/')
      .map((part) => {
        try {
          return encodeURIComponent(decodeURIComponent(part));
        } catch (e) {
          return encodeURIComponent(part);
        }
      })
      .join('/');
  }

  /** JPG/PNG fallback path (always exists on disk). */
  function fallbackSrc(src) {
    if (isAbsoluteUrl(src)) return String(src).trim();
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
    if (isAbsoluteUrl(src)) return String(src).trim();
    return fallbackSrc(src).replace(/\.(jpe?g|png)(\?.*)?$/i, '.avif$2');
  }

  function picture(src, alt, options) {
    const opts = options || {};
    const cls = opts.className ? ` class="${opts.className}"` : '';
    const loading = opts.loading || 'lazy';
    const decoding = opts.decoding || 'async';
    const fetchPriority = opts.fetchPriority ? ` fetchpriority="${opts.fetchPriority}"` : '';
    const safeAlt = String(alt || '').replace(/"/g, '&quot;');

    // External URLs (Google Drive, CDN) — plain img, never AVIF/path encoding
    if (isAbsoluteUrl(src) || String(src || '').startsWith('data:')) {
      const href = String(src).trim().replace(/"/g, '&quot;');
      const driveIdMatch = href.match(/[?&]id=([^&]+)/) || href.match(/\/d\/([^/=?#&]+)/);
      const driveId = driveIdMatch ? driveIdMatch[1] : '';
      const driveAttr = driveId ? ` data-drive-id="${driveId}"` : '';
      return (
        `<img src="${href}" alt="${safeAlt}"${cls} loading="${loading}" decoding="${decoding}"${fetchPriority} referrerpolicy="no-referrer"${driveAttr}>`
      );
    }

    const fallback = fallbackSrc(src);
    const avif = avifSrc(fallback);
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
    if (!src || isAbsoluteUrl(src)) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = picture(src, img.getAttribute('alt') || '', {
      className: img.className || '',
      loading: img.getAttribute('loading') || 'lazy',
      decoding: img.getAttribute('decoding') || 'async',
      fetchPriority: img.getAttribute('fetchpriority') || '',
    });
    const pictureEl = wrap.firstElementChild;
    const newImg = pictureEl.querySelector('img') || pictureEl;
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
