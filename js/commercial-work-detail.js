(function () {
  function getSectorId() {
    return new URLSearchParams(window.location.search).get('sector') || '';
  }

  function getProjectKey() {
    return new URLSearchParams(window.location.search).get('project') || '';
  }

  function getSectorProjects(sectorId) {
    if (!window.SayHomesCommercial) return [];
    if (sectorId && SayHomesCommercial.SECTORS[sectorId]) {
      return SayHomesCommercial.sectorProjects(sectorId);
    }
    return Object.keys(SayHomesCommercial.PROJECTS || {})
      .map((key) => SayHomesCommercial.projectCard ? SayHomesCommercial.projectCard(key) : null)
      .filter(Boolean);
  }

  function renderProjectDetail(container) {
    if (!container || !window.SayHomesCommercial) return;

    const sectorId = getSectorId();
    const projectKey = getProjectKey();
    const sector = sectorId ? SayHomesCommercial.SECTORS[sectorId] : null;
    const list = getSectorProjects(sectorId);
    let currentIndex = list.findIndex((item) => item.key === projectKey);
    if (currentIndex < 0) currentIndex = 0;

    const selectedMeta = list[currentIndex] || list[0];
    const selectedProject = selectedMeta
      ? SayHomesCommercial.getProject(selectedMeta.key)
      : SayHomesCommercial.getProject(projectKey) || SayHomesCommercial.getProject('leaders');

    if (!selectedProject) {
      container.innerHTML = '<p>No project selected.</p>';
      return;
    }

    const galleryImages = (selectedProject.images || []).filter(Boolean);
    const heroImage = galleryImages[0] || '';
    const sectorLabel = sector ? sector.title : 'Commercial';
    const backHref = sectorId
      ? `commercial-works.html?sector=${encodeURIComponent(sectorId)}`
      : 'CommercialProjects.html';
    const backLabel = sector ? `BACK TO ${sector.title.toUpperCase()}` : 'BACK TO PROJECTS';

    const backBtn = document.getElementById('btnBackProjects');
    if (backBtn) {
      backBtn.href = backHref;
      backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> ${backLabel}`;
    }

    document.title = `${selectedProject.name || 'Commercial Project'} | SayHomes`;

    container.innerHTML = `
      <section class="hero-card">
        <div class="hero-content">
          <p class="hero-kicker">${sectorLabel} Project</p>
          <h1 class="hero-title">${selectedProject.name}</h1>
          <p class="hero-subtitle">${sectorLabel} commercial work by SayHomes</p>
          <a href="https://wa.me/919686326936?text=${encodeURIComponent('Hi SayHomes, I am interested in a similar commercial project like ' + (selectedProject.name || '') + '.')}" class="hero-wa-cta" target="_blank" rel="noopener noreferrer">
            Start a Similar Project <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
        <div class="hero-media">
          <img src="${heroImage}" alt="${selectedProject.name}" loading="lazy">
        </div>
      </section>

      <section class="gallery-section-wrapper">
        <p class="gallery-section-tag">Gallery</p>
        <div class="gallery-grid-display">
          ${galleryImages.map((img, imageIndex) => `
            <div class="gallery-grid-card" data-full-src="${img}">
              <img src="${img}" alt="${selectedProject.name} View ${imageIndex + 1}" loading="lazy">
              <span class="view-label">View</span>
            </div>
          `).join('')}
        </div>
      </section>

      ${selectedProject.video ? `
      <section class="video-section">
        <p class="gallery-section-tag">Video</p>
        <div class="video-box">
          <iframe src="${selectedProject.video}" title="${selectedProject.name} video" allowfullscreen loading="lazy"></iframe>
        </div>
      </section>` : ''}

      <div id="sayhomesLightbox" class="sayhomes-lightbox-modal">
        <span class="lightbox-close-btn">&times;</span>
        <button type="button" class="lightbox-nav-btn lightbox-nav-prev" aria-label="Previous image">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button type="button" class="lightbox-nav-btn lightbox-nav-next" aria-label="Next image">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        <div class="lightbox-img-wrapper">
          <img class="lightbox-modal-img" id="lightboxActiveTargetImage" alt="Project image">
        </div>
      </div>
    `;

    const lightboxModal = container.querySelector('#sayhomesLightbox');
    const lightboxImg = container.querySelector('#lightboxActiveTargetImage');
    const closeBtn = container.querySelector('.lightbox-close-btn');
    const prevLightboxBtn = container.querySelector('.lightbox-nav-prev');
    const nextLightboxBtn = container.querySelector('.lightbox-nav-next');
    const galleryCards = Array.from(container.querySelectorAll('.gallery-grid-card'));
    let currentLightboxIndex = 0;

    function openLightbox(index) {
      if (!galleryImages.length) return;
      currentLightboxIndex = (index + galleryImages.length) % galleryImages.length;
      lightboxImg.src = galleryImages[currentLightboxIndex];
      lightboxModal.classList.add('reveal-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightboxModal.classList.remove('reveal-open');
      document.body.style.overflow = '';
    }

    function showNext() {
      openLightbox(currentLightboxIndex + 1);
    }

    function showPrev() {
      openLightbox(currentLightboxIndex - 1);
    }

    galleryCards.forEach((card, index) => {
      card.addEventListener('click', () => openLightbox(index));
    });

    function shouldIgnoreLightboxBackdropClick(target) {
      return (
        target.closest('.lightbox-modal-img') ||
        target.closest('.lightbox-nav-btn') ||
        target.closest('.lightbox-close-btn')
      );
    }

    closeBtn?.addEventListener('click', closeLightbox);
    prevLightboxBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      showPrev();
    });
    nextLightboxBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      showNext();
    });
    lightboxModal?.addEventListener('click', (e) => {
      if (!shouldIgnoreLightboxBackdropClick(e.target)) closeLightbox();
    });

    document.addEventListener('keydown', function onKey(e) {
      if (!lightboxModal.classList.contains('reveal-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    });

    const prevBtn = document.getElementById('btnPrevProject');
    const nextBtn = document.getElementById('btnNextProject');

    function goToIndex(index) {
      if (!list.length) return;
      const target = list[(index + list.length) % list.length];
      if (!target) return;
      const params = new URLSearchParams();
      params.set('project', target.key);
      if (sectorId) params.set('sector', sectorId);
      window.location.href = `commercial-work-detail.html?${params.toString()}`;
    }

    if (prevBtn) {
      prevBtn.onclick = () => goToIndex(currentIndex - 1);
      prevBtn.style.display = list.length > 1 ? '' : 'none';
    }
    if (nextBtn) {
      nextBtn.onclick = () => goToIndex(currentIndex + 1);
      nextBtn.style.display = list.length > 1 ? '' : 'none';
    }
  }

  window.SayHomesCommercialProjectDetail = {
    renderProjectDetail,
  };
})();
