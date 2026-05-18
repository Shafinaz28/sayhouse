(function () {
  const viewerTimers = new Map();

  function normalizeOwnerKey(name) {
    return String(name || '')
      .replace(/^(mr|mrs|ms|dr)\.\s*/i, '')
      .trim()
      .toLowerCase();
  }

  const OWNER_ALIASES = {
    'shilpa anjaneya': ['anjaneya residence'],
    'anjaneya residence': ['shilpa anjaneya'],
  };

  function ownerKeys(name) {
    const key = normalizeOwnerKey(name);
    const aliases = OWNER_ALIASES[key] || [];
    return [key, ...aliases];
  }

  function findByOwner(list, owner) {
    if (!list || !list.length) return null;
    const keys = ownerKeys(owner);
    return list.find((p) => ownerKeys(p.owner).some((k) => keys.includes(k))) || null;
  }

  function uniqueImages(images) {
    const seen = new Set();
    return (images || []).filter((src) => {
      if (!src || seen.has(src)) return false;
      seen.add(src);
      return true;
    });
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createViewerSection(id, title, subtitle, images, owner) {
    const imgs = uniqueImages(images);
    if (!imgs.length) return '';

    const altBase = escapeHtml(owner + ' — ' + title);
    const sub = subtitle
      ? `<p class="gallery-section-sub">${escapeHtml(subtitle)}</p>`
      : '';

    const thumbs = imgs
      .map(
        (src, i) =>
          `<button type="button" class="viewer-thumb${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="View image ${i + 1}"><img src="${escapeHtml(src)}" alt="${altBase} ${i + 1}" loading="lazy"></button>`
      )
      .join('');

    return `
      <div class="gallery-section" data-viewer="${id}">
        <h4 class="gallery-section-title">${escapeHtml(title)}</h4>
        ${sub}
        <img class="viewer-main" src="${escapeHtml(imgs[0])}" alt="${altBase}" loading="lazy">
        <div class="viewer-thumbs">${thumbs}</div>
      </div>`;
  }

  function renderViewer(sectionEl) {
    const imgs = JSON.parse(sectionEl.dataset.images || '[]');
    if (!imgs.length) return;

    let idx = Number(sectionEl.dataset.index || 0);
    if (idx >= imgs.length) idx = 0;

    const main = sectionEl.querySelector('.viewer-main');
    const thumbs = sectionEl.querySelectorAll('.viewer-thumb');

    if (main) {
      main.src = imgs[idx];
      main.alt = sectionEl.dataset.alt || '';
    }
    thumbs.forEach((btn, i) => btn.classList.toggle('active', i === idx));
    sectionEl.dataset.index = String(idx);
  }

  function startViewerTimer(sectionEl) {
    const id = sectionEl.dataset.viewer;
    if (!id) return;

    if (viewerTimers.has(id)) {
      clearInterval(viewerTimers.get(id));
    }

    const imgs = JSON.parse(sectionEl.dataset.images || '[]');
    if (imgs.length <= 1) return;

    const timer = setInterval(() => {
      let idx = Number(sectionEl.dataset.index || 0);
      idx = (idx + 1) % imgs.length;
      sectionEl.dataset.index = String(idx);
      renderViewer(sectionEl);
    }, 2600);

    viewerTimers.set(id, timer);
  }

  function initViewers(container) {
    if (!container) return;

    container.querySelectorAll('.gallery-section[data-viewer]').forEach((sectionEl, i) => {
      const id = sectionEl.dataset.viewer || 'viewer-' + i;
      sectionEl.dataset.viewer = id;

      const main = sectionEl.querySelector('.viewer-main');
      const imgs = [...sectionEl.querySelectorAll('.viewer-thumb img')].map((img) =>
        img.getAttribute('src')
      );
      sectionEl.dataset.images = JSON.stringify(imgs);
      sectionEl.dataset.index = '0';
      sectionEl.dataset.alt = main ? main.getAttribute('alt') || '' : '';

      sectionEl.querySelectorAll('.viewer-thumb').forEach((btn) => {
        btn.addEventListener('click', () => {
          sectionEl.dataset.index = btn.dataset.index || '0';
          renderViewer(sectionEl);
          startViewerTimer(sectionEl);
        });
      });

      renderViewer(sectionEl);
      startViewerTimer(sectionEl);
    });
  }

  function destroyViewers() {
    viewerTimers.forEach((timer) => clearInterval(timer));
    viewerTimers.clear();
  }

  window.SayHomesGallery = {
    normalizeOwnerKey,
    findByOwner,
    destroyViewers,

    openCombined(owner, currentProject, pageType) {
      const interiorList = window.INTERIOR_PROJECTS || [];
      const buildingList = window.BUILDING_PROJECTS || [];
      const interior =
        pageType === 'interior' ? currentProject : findByOwner(interiorList, owner);
      const building =
        pageType === 'building' ? currentProject : findByOwner(buildingList, owner);

      const titleEl = document.getElementById('modalTitle');
      const subtitleEl = document.getElementById('modalSubtitle');
      const imagesEl = document.getElementById('modalImages');
      const modal = document.getElementById('galleryModal');
      if (!titleEl || !imagesEl || !modal) return;

      destroyViewers();

      titleEl.innerText = owner;

      const hasInterior = interior && interior.gallery?.length;
      const hasBuilding = building && building.gallery?.length;

      if (hasInterior && hasBuilding) {
        subtitleEl.innerText = 'Interior & Building Construction — All Projects';
      } else if (hasInterior) {
        subtitleEl.innerText = interior.title || 'Interior — All Projects';
      } else if (hasBuilding) {
        subtitleEl.innerText = building.title || 'Building Construction — All Projects';
      } else {
        subtitleEl.innerText = currentProject.title || '';
      }

      let html = '';
      let viewerIndex = 0;

      if (hasInterior) {
        html += createViewerSection(
          'viewer-' + viewerIndex++,
          'Interior Design',
          interior.title,
          interior.gallery,
          owner
        );
      }
      if (hasBuilding) {
        html += createViewerSection(
          'viewer-' + viewerIndex++,
          'Building Construction',
          building.title,
          building.gallery,
          owner
        );
      }

      if (!html) {
        html = createViewerSection(
          'viewer-0',
          pageType === 'building' ? 'Building Construction' : 'Interior Design',
          currentProject.title,
          currentProject.gallery,
          owner
        );
      }

      imagesEl.innerHTML = html;
      initViewers(imagesEl);
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    },
  };
})();
