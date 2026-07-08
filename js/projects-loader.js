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
  const PROJECTS_API_URL = '';

  let loadPromise = null;
  let loaded = false;

  function isShown(val) {
    const show = String(val || 'YES').trim().toUpperCase();
    return show !== 'NO' && show !== 'N' && show !== 'FALSE' && show !== '0';
  }

  function parseGallery(text) {
    return String(text || '')
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function sortByOwner(list) {
    const clean = (name) => String(name || '').replace(/^(mr|mrs|ms|dr)\.\s*/i, '').trim().toLowerCase();
    return [...list].sort((a, b) => clean(a.owner).localeCompare(clean(b.owner)));
  }

  function normalizeResidential(list, fallbackDescription) {
    return sortByOwner(
      (list || [])
        .map((p) => {
          const gallery = (p.gallery || []).filter(Boolean);
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
            cover: p.cover || gallery[0],
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
      const images = (row.images || row.gallery || []).filter(Boolean);
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

  function applyPayload(data) {
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
      loaded = true;
      return false;
    }

    try {
      const res = await fetch(PROJECTS_API_URL, { cache: 'no-store' });
      const data = await res.json();
      const ok = applyPayload(data);
      if (!ok) {
        console.warn('Projects sheet returned no usable rows — using built-in project data.');
      }
      return ok;
    } catch (err) {
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
