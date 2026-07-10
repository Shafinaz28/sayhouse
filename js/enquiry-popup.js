(function () {
  const NEXT_AT_KEY = 'sayhomes_popup_next_at';
  const POPUP_DONE_KEY = 'sayhomes_popup_submitted';
  const INTERVAL_MS = 3 * 60 * 1000;

  let popupEl = null;
  let showTimeout = null;
  let watchInterval = null;

  function isBlocked() {
    return sessionStorage.getItem(POPUP_DONE_KEY) === '1';
  }

  function clearShowTimeout() {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }
  }

  function isOpen() {
    return popupEl?.classList.contains('active');
  }

  function planNextShow(delayMs) {
    clearShowTimeout();
    if (isBlocked() || isOpen()) return;

    const wait = Math.max(0, delayMs);
    const nextAt = Date.now() + wait;
    sessionStorage.setItem(NEXT_AT_KEY, String(nextAt));

    showTimeout = setTimeout(openPopup, wait);
  }

  function openPopup(manual) {
    if (!manual && isBlocked()) return;
    if (isOpen()) return;

    clearShowTimeout();
    buildPopup();

    popupEl.classList.add('active');
    popupEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const form = popupEl.querySelector('form.lead-form');
    if (form && form.dataset.leadBound !== '1' && typeof window.initLeadForm === 'function') {
      window.initLeadForm(form);
    }
  }

  function buildPopup() {
    if (document.getElementById('enquiryPopup')) {
      popupEl = document.getElementById('enquiryPopup');
      return;
    }

    const pageName = document.title.replace(/\s*\|.*$/, '').trim() || 'SayHomes';
    const source = 'SayHomes Popup — ' + pageName;

    popupEl = document.createElement('div');
    popupEl.id = 'enquiryPopup';
    popupEl.className = 'enquiry-popup';
    popupEl.setAttribute('role', 'dialog');
    popupEl.setAttribute('aria-modal', 'true');
    popupEl.setAttribute('aria-hidden', 'true');
    popupEl.setAttribute('aria-labelledby', 'enquiryPopupTitle');

    popupEl.innerHTML = `
      <div class="enquiry-popup-backdrop" data-close-popup></div>
      <div class="enquiry-popup-box">
        <button type="button" class="enquiry-popup-close" data-close-popup aria-label="Close enquiry form">&times;</button>
        <div class="enquiry-popup-header">
          <p class="enquiry-popup-kicker">Get In Touch</p>
          <h2 id="enquiryPopupTitle">Let's Build Together</h2>
          <p>Share your details and our team will get back to you within 24 hours.</p>
        </div>
        <form class="lead-form enquiry-popup-form" data-source="${source.replace(/"/g, '&quot;')}" novalidate>
          <input type="hidden" name="source" value="${source.replace(/"/g, '&quot;')}">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="popup-name">Full Name</label>
              <input class="form-input" id="popup-name" name="name" type="text" placeholder="Your full name" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="popup-phone">Phone Number</label>
              <input class="form-input" id="popup-phone" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="popup-email">Email Address</label>
            <input class="form-input" id="popup-email" name="email" type="email" placeholder="you@example.com" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="popup-location">Location</label>
              <input class="form-input" id="popup-location" name="location" type="text" placeholder="Your city">
            </div>
            <div class="form-group">
              <label class="form-label" for="popup-service">Service Required</label>
              <select class="form-input" id="popup-service" name="service" required>
                <option value="">Select a service</option>
                <option value="Building Construction">Building Construction</option>
                <option value="PEB (Pre Engineered Buildings)">PEB (Pre Engineered Buildings)</option>
                <option value="Architecture">Architecture</option>
                <option value="Interior Design">Interior Design</option>
                <option value="Consultation">Consultation</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="popup-message">Message</label>
            <textarea class="form-input" id="popup-message" name="message" rows="3" placeholder="Tell us about your project..."></textarea>
          </div>
          <button type="submit" class="submit-btn" data-submit-btn>
            <span data-btn-text>Submit Enquiry</span>
            <i class="fa-solid fa-arrow-right" data-btn-icon></i>
            <span class="btn-spinner hidden" data-btn-spinner aria-hidden="true"></span>
          </button>
        </form>
      </div>`;

    document.body.appendChild(popupEl);

    popupEl.querySelectorAll('[data-close-popup]').forEach((el) => {
      el.addEventListener('click', () => closePopup());
    });

    const form = popupEl.querySelector('form.lead-form');
    form.addEventListener('leadform:success', () => {
      sessionStorage.setItem(POPUP_DONE_KEY, '1');
      closePopup(true);
    });

    if (typeof window.initLeadForm === 'function') {
      window.initLeadForm(form);
    }
  }

  function closePopup(permanent) {
    if (!popupEl) return;
    popupEl.classList.remove('active');
    popupEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (permanent) {
      clearShowTimeout();
      sessionStorage.removeItem(NEXT_AT_KEY);
      return;
    }

    planNextShow(INTERVAL_MS);
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && isOpen()) {
      closePopup();
    }
  }

  function resumeSchedule() {
    if (isBlocked() || isOpen()) return;

    const nextAt = Number(sessionStorage.getItem(NEXT_AT_KEY) || 0);
    if (!nextAt) {
      planNextShow(INTERVAL_MS);
      return;
    }

    const remaining = nextAt - Date.now();
    if (remaining <= 0) {
      openPopup();
    } else {
      planNextShow(remaining);
    }
  }

  function watchDue() {
    if (isBlocked() || isOpen() || showTimeout) return;
    const nextAt = Number(sessionStorage.getItem(NEXT_AT_KEY) || 0);
    if (nextAt && Date.now() >= nextAt) {
      openPopup();
    }
  }

  function boot() {
    sessionStorage.removeItem('sayhomes_lead_submitted');
    document.addEventListener('keydown', onKeydown);
    resumeSchedule();
    watchInterval = setInterval(watchDue, 5000);
  }

  window.SayHomesEnquiry = {
    open: () => openPopup(true),
    close: closePopup,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
