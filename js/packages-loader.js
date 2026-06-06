(function () {
  /**
   * Packages Google Sheet (one tab):
   * https://docs.google.com/spreadsheets/d/19MVCeWzCCS7kORemCrGnf9emsy6__gYteo2UcywE2Ok/edit
   *
   * Package Name | Old Price | New Price | Sort Order | Show | Section Title | Section Sort | Details
   * One row per section. Details = one bullet per line (Alt+Enter in sheet).
   * Import: google-sheet-import/Packages.csv
   */
  const PACKAGES_API_URL =
    'https://script.google.com/macros/s/AKfycbzRsSy4VC72Hr-0lHG3BcJVDkrn_GdTROh6-UlwxAmxOWLe5_uXmQ8KcZCz0cgf8G7u/exec';

  const REVEAL_DELAYS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function detailLines(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function renderSection(section) {
    const lines = detailLines(section.details);
    return `
      <details class="package-detail">
        <summary class="package-summary">
          ${escapeHtml(section.title)}
          <i class="fa-solid fa-chevron-down arrow text-sm text-slate-500 transition"></i>
        </summary>
        <div class="package-detail-body">
          ${lines.map((line) => `<p class="detail-line">${escapeHtml(line)}</p>`).join('')}
        </div>
      </details>`;
  }

  function renderPackage(pkg, index, cardInnerHtml) {
    const delay = REVEAL_DELAYS[index] || '';
    const oldPrice =
      pkg.oldPrice && String(pkg.oldPrice).length
        ? `<span class="old-price">₹${escapeHtml(pkg.oldPrice)}</span> `
        : '';
    const sections =
      cardInnerHtml ||
      (pkg.sections || []).map((section) => renderSection(section)).join('');

    return `
      <div class="package-column reveal ${delay}">
        <h2 class="package-title">
          <span class="plan-name">${escapeHtml(pkg.name)}</span>
          <span class="plan-price">${oldPrice}<span class="new-price">₹${escapeHtml(pkg.newPrice)}</span><span class="price-unit"> / sqft</span></span>
        </h2>
        <div class="package-card">${sections}</div>
      </div>`;
  }

  function normalizePrice(val) {
    if (val === '' || val === null || val === undefined) return '';
    return String(val).replace(/[^\d.]/g, '').trim();
  }

  function isShown(val) {
    const show = String(val || 'YES').trim().toUpperCase();
    return show !== 'NO' && show !== 'N' && show !== 'FALSE' && show !== '0';
  }

  function parseSheetRows(data) {
    if (!Array.isArray(data) || !data.length) return [];

    const packageMap = new Map();
    const order = [];

    data.forEach((row) => {
      if (!isShown(row.Show)) return;

      const name = String(row['Package Name'] || '').trim();
      if (!name) return;

      if (!packageMap.has(name)) {
        packageMap.set(name, {
          name,
          oldPrice: normalizePrice(row['Old Price']),
          newPrice: normalizePrice(row['New Price']),
          sortOrder: Number(row['Sort Order']) || order.length + 1,
          sections: [],
        });
        order.push(name);
      }

      const title = String(row['Section Title'] || '').trim();
      if (!title) return;

      packageMap.get(name).sections.push({
        title,
        sortOrder: Number(row['Section Sort']) || packageMap.get(name).sections.length + 1,
        details: String(row['Details'] || '').trim(),
      });
    });

    return order
      .map((name) => {
        const pkg = packageMap.get(name);
        pkg.sections.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        return pkg;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  function parsePackagesResponse(data) {
    if (data && Array.isArray(data.packages)) return data.packages;
    if (Array.isArray(data)) return parseSheetRows(data);
    if (data && data.ok && Array.isArray(data.packages)) return data.packages;
    return [];
  }

  function captureBuiltinCards(grid) {
    const map = {};
    grid.querySelectorAll('.package-column').forEach((col) => {
      const name = col.querySelector('.plan-name')?.textContent?.trim();
      const card = col.querySelector('.package-card');
      if (name && card) map[name] = card.innerHTML;
    });
    return map;
  }

  function updateGridColumns(grid, count) {
    if (!grid || count < 1) return;
    const cols = Math.min(count, 4);
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.dataset.packageCount = String(count);
  }

  function initPackageDetailSync(root) {
    const scope = root || document;
    let syncing = false;

    scope.querySelectorAll('.package-card').forEach((card) => {
      card.querySelectorAll('details').forEach((item) => {
        if (item.dataset.syncBound === '1') return;
        item.dataset.syncBound = '1';

        item.addEventListener('toggle', function () {
          if (syncing) return;

          const summary = this.querySelector('.package-summary');
          if (!summary) return;

          const label = summary.childNodes[0]?.textContent?.trim() || '';
          if (!label) return;

          syncing = true;
          document.querySelectorAll('.package-card details').forEach((other) => {
            const otherSummary = other.querySelector('.package-summary');
            const otherLabel = otherSummary?.childNodes[0]?.textContent?.trim() || '';

            if (this.open) {
              if (otherLabel === label) other.setAttribute('open', '');
              else other.removeAttribute('open');
            } else if (otherLabel === label) {
              other.removeAttribute('open');
            }
          });
          syncing = false;
        });
      });
    });
  }

  function observeReveals(root) {
    const nodes = (root || document).querySelectorAll('.reveal:not([data-observed])');
    if (!nodes.length) return;

    const observer =
      window.__packagesRevealObserver ||
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );

    window.__packagesRevealObserver = observer;
    nodes.forEach((el) => {
      el.dataset.observed = '1';
      observer.observe(el);
    });
  }

  function setLoading(on) {
    const el = document.getElementById('packagesLoading');
    if (el) el.hidden = !on;
  }

  async function loadFromSheet() {
    const grid = document.getElementById('packagesGrid');
    if (!grid || !PACKAGES_API_URL) return;

    setLoading(true);

    const builtinCards = captureBuiltinCards(grid);

    try {
      const res = await fetch(PACKAGES_API_URL, { cache: 'no-store' });
      const data = await res.json();

      const packages = parsePackagesResponse(data);

      if (!packages.length) {
        console.warn('Packages sheet returned no data — using built-in packages.');
        return;
      }

      grid.innerHTML = packages
        .map((pkg, i) =>
          renderPackage(pkg, i, pkg.sections.length ? null : builtinCards[pkg.name])
        )
        .join('');
      updateGridColumns(grid, packages.length);
      initPackageDetailSync(grid);
      observeReveals(grid);
    } catch (err) {
      console.warn('Could not load packages from Google Sheet — using built-in packages.', err);
    } finally {
      setLoading(false);
    }
  }

  window.SayHomesPackages = {
    initPackageDetailSync,
    observeReveals,
    loadFromSheet,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFromSheet);
  } else {
    loadFromSheet();
  }
})();
