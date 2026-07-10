(function () {
  function toAvif(src) {
    return String(src || '').replace(/\.(jpe?g|png|webp)(\?.*)?$/i, '.avif$2');
  }

  function picture(src, alt, options) {
    const opts = options || {};
    const avif = toAvif(src);
    const cls = opts.className ? ` class="${opts.className}"` : '';
    const loading = opts.loading || 'lazy';
    const decoding = opts.decoding || 'async';
    const safeAlt = String(alt || '').replace(/"/g, '&quot;');
    return `<picture><source srcset="${avif}" type="image/avif"><img src="${src}" alt="${safeAlt}"${cls} loading="${loading}" decoding="${decoding}"></picture>`;
  }

  function upgradeImg(img) {
    if (!img || img.closest('picture')) return;
    const src = img.getAttribute('src');
    if (!src || !/\.(jpe?g|png|webp)(\?.*)?$/i.test(src)) return;

    const alt = img.getAttribute('alt') || '';
    const wrap = document.createElement('div');
    wrap.innerHTML = picture(src, alt, {
      className: img.className || '',
      loading: img.getAttribute('loading') || 'lazy',
      decoding: img.getAttribute('decoding') || 'async',
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
    (root || document).querySelectorAll('img[data-avif], .project-img img, .gallery-item img').forEach(upgradeImg);
  }

  window.SayHomesAvif = {
    toAvif,
    picture,
    upgradeImg,
    upgradeAll,
  };
})();
