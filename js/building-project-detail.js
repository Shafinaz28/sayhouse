(function () {
  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function getProjects() {
    return Array.isArray(window.BUILDING_PROJECTS) ? window.BUILDING_PROJECTS : [];
  }

  function getProjectBySlug(projects, slug) {
    if (!projects.length) return null;
    const match = projects.find((project) => slugify(`${project.owner}-${project.title}`) === slug);
    return match || projects[0] || null;
  }

  function renderProjectDetail(container, projects, slug) {
    if (!container) return;

    const projectList = Array.isArray(projects) ? projects : getProjects();
    const normalizedSlug = slugify(slug || '');
    const currentIndex = projectList.findIndex((project) => slugify(`${project.owner}-${project.title}`) === normalizedSlug);
    const selectedProject = getProjectBySlug(projectList, normalizedSlug);
    const navIndex = currentIndex >= 0 ? currentIndex : 0;

    function render() {
      if (!selectedProject) {
        container.innerHTML = '<p>No project selected.</p>';
        return;
      }

      const galleryImages = (selectedProject.gallery || []).filter(Boolean);
      const heroImage = galleryImages[0] || '';

      document.title = `${selectedProject.owner || 'Building Project'} | SayHomes`;

      const pic = (src, alt, opts) =>
        window.SayHomesAvif
          ? SayHomesAvif.picture(src, alt, opts)
          : `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}" loading="${opts?.loading || 'lazy'}">`;

      container.innerHTML = `
        <section class="hero-card">
          <div class="hero-content">
            <p class="hero-kicker">Building Construction Project</p>
            <h1 class="hero-title">${selectedProject.owner}</h1>
            <p class="hero-subtitle">${selectedProject.title || 'Residential Project'}</p>
            <a href="https://wa.me/919686326936?text=${encodeURIComponent('Hi SayHomes, I am interested in a similar building construction project like ' + (selectedProject.owner || '') + ' — ' + (selectedProject.title || '') + '.')}" class="hero-wa-cta" target="_blank" rel="noopener noreferrer">
              Start a Similar Project <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
          <div class="hero-media">
            ${pic(heroImage, `${selectedProject.owner} — ${selectedProject.title}`, { loading: 'eager', fetchPriority: 'high' })}
          </div>
        </section>

        <section class="gallery-section-wrapper">
          <p class="gallery-section-tag">Gallery</p>
          <div class="gallery-grid-display">
            ${galleryImages.map((img, imageIndex) => `
              <div class="gallery-grid-card" data-full-src="${window.SayHomesAvif ? SayHomesAvif.fallbackSrc(img) : img}">
                ${pic(img, `${selectedProject.owner} View ${imageIndex + 1}`, { loading: 'lazy' })}
                <span class="view-label">View</span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Dynamic Fullscreen Lightbox Modal Overlay Container -->
        <div id="sayhomesLightbox" class="sayhomes-lightbox-modal">
          <span class="lightbox-close-btn">&times;</span>
          <button type="button" class="lightbox-nav-btn lightbox-nav-prev" aria-label="Previous image">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" class="lightbox-nav-btn lightbox-nav-next" aria-label="Next image">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <div class="lightbox-img-wrapper">
            <img class="lightbox-modal-img" id="lightboxActiveTargetImage">
          </div>
        </div>
      `;

      // --- Lightbox Interactive Functionality Logic ---
      const lightboxModal = container.querySelector('#sayhomesLightbox');
      const lightboxImg = container.querySelector('#lightboxActiveTargetImage');
      const closeBtn = container.querySelector('.lightbox-close-btn');
      const prevLightboxBtn = container.querySelector('.lightbox-nav-prev');
      const nextLightboxBtn = container.querySelector('.lightbox-nav-next');
      let activeImageIndex = 0;

      function applyLightboxImage() {
        if (!lightboxImg || !galleryImages.length) return;
        const idx = ((activeImageIndex % galleryImages.length) + galleryImages.length) % galleryImages.length;
        activeImageIndex = idx;
        lightboxImg.src = galleryImages[idx];
      }

      function openLightboxAt(index) {
        if (!lightboxModal || !lightboxImg || !galleryImages.length) return;
        activeImageIndex = index;
        applyLightboxImage();
        lightboxModal.classList.add('reveal-open');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('reveal-open');
        document.body.style.overflow = '';
      }

      function lightboxPrev() {
        if (!galleryImages.length) return;
        activeImageIndex -= 1;
        applyLightboxImage();
      }

      function lightboxNext() {
        if (!galleryImages.length) return;
        activeImageIndex += 1;
        applyLightboxImage();
      }

      container.querySelectorAll('.gallery-grid-card').forEach((card, cardIndex) => {
        card.addEventListener('click', () => {
          openLightboxAt(cardIndex);
        });
      });

      function shouldIgnoreLightboxBackdropClick(target) {
        return (
          target.closest('.lightbox-modal-img') ||
          target.closest('.lightbox-nav-btn') ||
          target.closest('.lightbox-close-btn')
        );
      }

      if (lightboxModal && closeBtn) {
        // Close on clicking 'X'
        closeBtn.addEventListener('click', closeLightbox);
        if (prevLightboxBtn) {
          prevLightboxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lightboxPrev();
          });
        }
        if (nextLightboxBtn) {
          nextLightboxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lightboxNext();
          });
        }

        // Close on backdrop or empty space beside the image
        lightboxModal.addEventListener('click', (e) => {
          if (!shouldIgnoreLightboxBackdropClick(e.target)) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
          if (!lightboxModal.classList.contains('reveal-open')) return;
          if (e.key === 'Escape') closeLightbox();
          if (e.key === 'ArrowLeft') lightboxPrev();
          if (e.key === 'ArrowRight') lightboxNext();
        });
      }

      // Synchronize Project Pagination Navigation Handles
      const prevBtn = document.getElementById('btnPrevProject');
      const nextBtn = document.getElementById('btnNextProject');

      function goToProject(index) {
        if (!projectList.length) return;
        const targetIndex = ((index % projectList.length) + projectList.length) % projectList.length;
        const targetProject = projectList[targetIndex];
        if (!targetProject) return;
        window.location.href = `building-project-detail.html?project=${slugify(`${targetProject.owner}-${targetProject.title}`)}`;
      }

      if (prevBtn) {
        prevBtn.style.display = projectList.length > 1 ? 'inline-flex' : 'none';
        prevBtn.onclick = () => goToProject(navIndex - 1);
      }

      if (nextBtn) {
        nextBtn.style.display = projectList.length > 1 ? 'inline-flex' : 'none';
        nextBtn.onclick = () => goToProject(navIndex + 1);
      }
    }

    render();
  }

  window.SayHomesBuildingProjectDetail = {
    slugify,
    renderProjectDetail,
  };
})();