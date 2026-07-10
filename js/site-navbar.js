(function () {
  function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const navToggle = document.getElementById('navToggle');
    const toggleIcon = navToggle ? navToggle.querySelector('i') : null;

    if (mobileMenu) mobileMenu.classList.remove('active');
    document.body.classList.remove('menu-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (toggleIcon) toggleIcon.className = 'fa-solid fa-bars';
  }

  function setActiveNav() {
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const navTargets = new Set([currentPage]);
    if (!currentPage) navTargets.add('index.html');
    if (['interior.html', 'buildingconstruction.html', 'commercialprojects.html'].includes(currentPage)) {
      navTargets.add('projects.html');
    }

    document.querySelectorAll('.nav-links a, #mobileMenu a').forEach((link) => {
      const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (href && navTargets.has(href)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function bindNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const toggleIcon = navToggle ? navToggle.querySelector('i') : null;

    function updateNavbar() {
      if (!navbar) return;
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }

    window.addEventListener('scroll', updateNavbar, { passive: true });
    window.addEventListener('load', updateNavbar);
    updateNavbar();

    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (toggleIcon) toggleIcon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
      });

      mobileMenu.querySelectorAll('a[href]:not([data-open-enquiry])').forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    setActiveNav();
  }

  function bindEnquiryTriggers() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-enquiry]');
      if (!trigger) return;

      e.preventDefault();
      closeMobileMenu();

      if (window.SayHomesEnquiry && typeof window.SayHomesEnquiry.open === 'function') {
        window.SayHomesEnquiry.open();
      }
    });
  }

  function boot() {
    if (document.documentElement.dataset.sayhomesNavbarBound === '1') return;
    document.documentElement.dataset.sayhomesNavbarBound = '1';
    bindNavbar();
    bindEnquiryTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
