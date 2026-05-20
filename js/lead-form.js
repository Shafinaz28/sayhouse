(function () {
  /**
   * Google Sheet (leads):
   * https://docs.google.com/spreadsheets/d/1ahF-xf9L1rRuGEb3QjFMvsubiCjD6a7mVCyjW67Bdow/edit
   * Sheet ID: 1ahF-xf9L1rRuGEb3QjFMvsubiCjD6a7mVCyjW67Bdow
   * Apps Script setup: google-apps-script/LeadFormHandler.gs
   */
  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbwfLGJTciZ49a_FB0ycDIZOtnvDCm7p5WIZPqaLcfd7pJeBlqxNMgK0mPyJMHySdh3C/exec';

  function setLoading(form, on) {
    const submitBtn = form.querySelector('[data-submit-btn]');
    const btnText = form.querySelector('[data-btn-text]');
    const btnIcon = form.querySelector('[data-btn-icon]');
    const btnSpinner = form.querySelector('[data-btn-spinner]');
    if (!submitBtn) return;
    submitBtn.disabled = on;
    if (btnText) btnText.textContent = on ? 'Submitting...' : 'Submit Enquiry';
    if (btnIcon) btnIcon.classList.toggle('hidden', on);
    if (btnSpinner) btnSpinner.classList.toggle('hidden', !on);
  }

  function fireSuccess() {
    if (typeof Swal === 'undefined') {
      alert("Enquiry sent! We'll call you back within 24 hours.");
      return;
    }
    Swal.fire({
      icon: 'success',
      title: 'Enquiry Sent!',
      text: "We'll call you back within 24 hours.",
      confirmButtonColor: '#B8860B',
    });
  }

  function fireError(msg) {
    if (typeof Swal === 'undefined') {
      alert(msg || 'Submission failed. Please try again or call us directly.');
      return;
    }
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: msg || 'Network issue. Please try again or call us directly.',
      confirmButtonColor: '#B8860B',
    });
  }

  function initLeadForm(form) {
    if (!form || form.dataset.leadBound === '1') return;
    form.dataset.leadBound = '1';

    const defaultSource = form.dataset.source || 'SayHomes Website';
    const sourceField = form.querySelector('[name="source"]');
    if (sourceField) sourceField.value = defaultSource;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      setLoading(form, true);

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Submitting...',
          text: 'Please wait',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading(),
        });
      }

      try {
        const fd = new FormData(form);
        const body = new URLSearchParams();
        fd.forEach((v, k) => body.append(k, String(v)));

        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: body.toString(),
        });

        if (typeof Swal !== 'undefined' && Swal.isVisible()) Swal.close();
        form.reset();
        if (sourceField) sourceField.value = defaultSource;
        setLoading(form, false);
        fireSuccess();
      } catch (err) {
        if (typeof Swal !== 'undefined' && Swal.isVisible()) Swal.close();
        setLoading(form, false);
        fireError('Could not submit. Please check internet and try again.');
        console.error(err);
      }
    });
  }

  function boot() {
    document.querySelectorAll('form.lead-form').forEach(initLeadForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
