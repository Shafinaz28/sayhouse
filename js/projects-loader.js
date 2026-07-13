(function () {
  /**
   * Projects Google Sheet tab "Projects"
   * Setup: PROJECTS_SHEET_SETUP.md
   *
   * Paste your deployed ProjectsApi.gs web app URL below (same URL for read + form submit).
   */
  /**
   * Same Web App URL as admin-project-form.html → PROJECTS_FORM_URL
   * Deploy ProjectsApi.gs → paste URL below.
   */
  const PROJECTS_API_URL = 'https://script.google.com/macros/s/AKfycby6tPXEN1yr0bL3_U1qXP0yQ0pbH9RP1ZMR6bsyTrEtAIiN73CczTIJRS4YouINYprAJw/exec';

  let loadPromise = null;
  let loaded = false;

  function isShown(val) {
    const show = String(val || 'YES').trim().toUpperCase();
    return show !== 'NO' && show !== 'N' && show !== 'FALSE' && show !== '0';
  }

  function extractDriveId(src) {
    const s = String(src || '').trim();
    const idMatch =
      s.match(/\/file\/d\/([^/?&#]+)/) ||
      s.match(/[?&]id=([^&]+)/) ||
      s.match(/\/thumbnail\?id=([^&]+)/) ||
      s.match(/\/uc\?.*?id=([^&]+)/) ||
      s.match(/lh3\.googleusercontent\.com\/d\/([^/=?#]+)/) ||
      s.match(/\/d\/([^/?&#]+)/);
    return idMatch && idMatch[1] ? idMatch[1] : '';
  }

  function normalizeDriveUrl(src) {
    const s = String(src || '').trim();
    if (!s) return '';
    if (/^https?:\/\/drive\.google$/i.test(s)) return ''; // truncated sheet cell
    const id = extractDriveId(s);
    if (id && (/drive\.google\.com|docs\.google\.com|googleusercontent\.com/i.test(s) || id.length > 20)) {
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    }
    return s;
  }

  function toFallbackPath(src) {
    const normalized = normalizeDriveUrl(src);
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return String(normalized || '')
      .replace(/^\.\//, '')
      .replace(/\.(avif|png|webp)(\?.*)?$/i, '.jpg$2');
  }

  function parseGallery(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((line) => {
        if (/^https?:\/\//i.test(line) || /drive\.google\.com/i.test(line)) return [line];
        return line.split(',').map((s) => s.trim()).filter(Boolean);
      })
      .map(toFallbackPath)
      .filter(Boolean);
  }

  function fallbackGallery(list) {
    return (list || []).filter(Boolean).map(toFallbackPath).filter(Boolean);
  }

  /** Only used if thumbnail fails — never preload all images through Apps Script */
  async function resolveDriveSrc(src) {
    const normalized = toFallbackPath(src);
    const id = extractDriveId(src) || extractDriveId(normalized);
    if (!id || !PROJECTS_API_URL) return normalized || '';

    try {
      const res = await fetch(
        `${PROJECTS_API_URL}?action=drive&id=${encodeURIComponent(id)}`,
        { cache: 'force-cache' }
      );
      const data = await res.json();
      if (data && data.ok && data.data) {
        return `data:${data.contentType || 'image/jpeg'};base64,${data.data}`;
      }
      if (data && data.url) return data.url;
    } catch (err) {
      console.warn('Drive image proxy failed', id, err);
    }
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }

  function bindDriveImageFallbacks(root) {
    const scope = root || document;
    scope.querySelectorAll('img[src*="drive.google.com"]').forEach((img) => {
      if (img.dataset.driveFallbackBound === '1') return;
      img.dataset.driveFallbackBound = '1';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';

      img.addEventListener('error', () => {
        const id = extractDriveId(img.getAttribute('src') || '');
        if (!id) return;

        if (img.dataset.driveFallbackStep !== 'uc') {
          img.dataset.driveFallbackStep = 'uc';
          img.src = `https://drive.google.com/uc?export=view&id=${id}`;
          return;
        }

        if (img.dataset.driveFallbackStep === 'uc' && img.dataset.driveProxyTried !== '1') {
          img.dataset.driveProxyTried = '1';
          resolveDriveSrc(id).then((proxied) => {
            if (proxied) img.src = proxied;
          });
        }
      });
    });
  }

  function sortByOwner(list) {
    const clean = (name) => String(name || '').replace(/^(mr|mrs|ms|dr)\.\s*/i, '').trim().toLowerCase();
    return [...list].sort((a, b) => clean(a.owner).localeCompare(clean(b.owner)));
  }

  function normalizeResidential(list, fallbackDescription) {
    return sortByOwner(
      (list || [])
        .map((p) => {
          const gallery = fallbackGallery(p.gallery);
          if (!gallery.length) return null;
          const title = p.title || p.location || '';
          return {
            owner: p.owner || '',
            title,
            location: p.location || title,
            description:
              p.description ||
              fallbackDescription(title, p.owner),
            gallery,
            cover: toFallbackPath(p.cover || gallery[0]),
          };
        })
        .filter(Boolean)
    );
  }

  function buildingFallbackDescription(title, owner) {
    return `Residential construction at ${title || 'Bengaluru'} — quality structure, elevation, and finishes.`;
  }

  function interiorFallbackDescription(title, owner) {
    return `Interior project for ${owner || 'client'} at ${title || 'Bengaluru'} — refined finishes and practical layouts.`;
  }

  function normalizeBuiltinData() {
    if (Array.isArray(window.BUILDING_PROJECTS) && window.BUILDING_PROJECTS.length) {
      window.BUILDING_PROJECTS = normalizeResidential(window.BUILDING_PROJECTS, buildingFallbackDescription);
    }

    if (Array.isArray(window.INTERIOR_PROJECTS) && window.INTERIOR_PROJECTS.length) {
      window.INTERIOR_PROJECTS = normalizeResidential(
        window.INTERIOR_PROJECTS.filter((p) => {
          const g = (p.gallery || []).filter(Boolean);
          return g.length && g[0] !== 'interior/';
        }),
        interiorFallbackDescription
      );
    }
  }

  function applyCommercialFromSheet(rows) {
    if (!window.SayHomesCommercial || !Array.isArray(rows) || !rows.length) return;

    const projects = { ...SayHomesCommercial.PROJECTS };
    const sectorKeys = {};

    Object.keys(SayHomesCommercial.SECTORS || {}).forEach((id) => {
      sectorKeys[id] = [];
    });

    rows.forEach((row) => {
      const key = String(row.key || '').trim();
      if (!key) return;
      const images = fallbackGallery(row.images || row.gallery);
      if (!images.length) return;

      projects[key] = {
        name: row.name || row.owner || key,
        video: row.video || '',
        images,
      };

      const sector = String(row.sector || 'commercial').trim().toLowerCase();
      if (!sectorKeys[sector]) sectorKeys[sector] = [];
      sectorKeys[sector].push(key);
    });

    SayHomesCommercial.PROJECTS = projects;

    Object.keys(sectorKeys).forEach((sectorId) => {
      if (!sectorKeys[sectorId].length) return;
      if (!SayHomesCommercial.SECTORS[sectorId]) return;
      SayHomesCommercial.SECTORS[sectorId] = {
        ...SayHomesCommercial.SECTORS[sectorId],
        projectKeys: sectorKeys[sectorId],
      };
    });
  }

  async function applyPayload(data) {
    if (!data) return false;

    const building = data.building || [];
    const interior = data.interior || [];
    const commercial = data.commercial || [];

    if (building.length) {
      window.BUILDING_PROJECTS = normalizeResidential(building, buildingFallbackDescription);
    }

    if (interior.length) {
      window.INTERIOR_PROJECTS = normalizeResidential(
        interior.filter((p) => {
          const g = (p.gallery || []).filter(Boolean);
          return g.length && g[0] !== 'interior/';
        }),
        interiorFallbackDescription
      );
    }

    if (commercial.length) {
      applyCommercialFromSheet(commercial);
    }

    return building.length > 0 || interior.length > 0 || commercial.length > 0;
  }

  async function loadFromSheet() {
    if (!PROJECTS_API_URL) {
      normalizeBuiltinData();
      loaded = true;
      return false;
    }

    try {
      const res = await fetch(PROJECTS_API_URL, { cache: 'no-store' });
      const data = await res.json();
      const ok = await applyPayload(data);
      if (!ok) {
        normalizeBuiltinData();
        console.warn('Projects sheet returned no usable rows — using built-in project data.');
      }
      return ok;
    } catch (err) {
      normalizeBuiltinData();
      console.warn('Could not load projects from Google Sheet — using built-in project data.', err);
      return false;
    } finally {
      loaded = true;
      document.dispatchEvent(new CustomEvent('sayhomes:projects-loaded'));
    }
  }

  function ensureLoaded() {
    if (loaded) return Promise.resolve();
    if (!loadPromise) loadPromise = loadFromSheet();
    return loadPromise;
  }

  window.SayHomesProjects = {
    ensureLoaded,
    loadFromSheet,
    bindDriveImageFallbacks,
    get loaded() {
      return loaded;
    },
    get apiUrl() {
      return PROJECTS_API_URL;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureLoaded();
    });
  } else {
    ensureLoaded();
  }
})();
