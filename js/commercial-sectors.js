(function () {
  const YT = 'https://www.youtube.com/embed/RRxhaxwYwN8';

  const PROJECTS = {
    leaders: {
      name: 'Leaders International School, Gauribidanur',
      video: YT,
      images: [
        'commercial/leaders-1.jpg',
        'commercial/leaders-2.jpg',
        'commercial/leaders-3.jpg',
        'commercial/leaders-4.jpg',
        'commercial/leaders-5.jpg',
        'commercial/leaders-6.jpg',
        'commercial/leaders-7.jpg',
      ],
    },
    ima: {
      name: 'IMA Convention Center',
      video: YT,
      images: [
        'commercial/IMA%20CENTRAL%20Elevation.jpg',
        'commercial/ima1.jpg',
        'commercial/ima2.jpg',
        'commercial/ima.jpg',
      ],
    },
    riverbed: {
      name: 'Riverbed Technology India Pvt Ltd, Bengaluru',
      video: YT,
      images: [
        'commercial/riverbed-6.jpg',
        'commercial/Scene%204_1.png',
        'commercial/riverbed-1.jpg',
        'commercial/riverbed-2.jpg',
        'commercial/riverbed-3.jpg',
        'commercial/riverbed-4.jpg',
        'commercial/riverbed-5.jpg',
        
        'commercial/riverbed-7.jpg',
        'commercial/riverbed-8.jpg',
        'commercial/riverbed-9.jpg',
        'commercial/riverbed-10.jpg',
        'commercial/riverbed-11.jpg',
        'commercial/riverbed-12.jpg',
      ],
    },
    f16: {
      name: 'F16',
      video: YT,
      images: ['commercial/lisg1.jpg', 'commercial/lisg2.jpg', 'commercial/lisg3.jpg'],
    },
    sriguru: {
      name: 'M/s SRI GURU KOTTURESHWARA BENNE DOSE HOTEL DAVANGERE',
      video: YT,
      images: [
        'commercial/Sriguru.png',
        'commercial/Sriguru1.png',
        'commercial/Sriguru2.png',
        'commercial/Sriguru3.png',
        'commercial/Sriguru4.png',
        'commercial/Sriguru5.png',
        'commercial/Sriguru6.png',
        'commercial/Sriguru7.png',
        'commercial/Sriguru8.png',
      ],
    },
    resort: {
      name: 'Resort at Gauribidanur',
      video: YT,
      images: ['commercial/resort.jpg', 'commercial/resort1.jpg'],
    },
    temple: {
      name: 'Anjaneya Temple, Rajanukunte',
      video: YT,
      images: [
        'commercial/temple1.jpg',
        'commercial/temple2.jpg',
        'commercial/temple3.jpg',
        'commercial/temple4.jpg',
      ],
    },
    gsk: {
      name: 'GSK Conventional Hall, Chikkaballapura',
      video: YT,
      images: ['commercial/GSK%20Conventional%20Hall,%20Chikkaballapura.jpg'],
    },
    anurag: {
      name: 'Mr. Anurag G+4, Chandra Layout',
      video: YT,
      images: ['commercial/anurag.jpg'],
    },
    railway: {
      name: 'Railway Quarters, Puttur, Mangaluru',
      video: YT,
      images: [
        'commercial/railway.jpg',
        'commercial/railway1.jpg',
        'commercial/railway2.jpg',
        'commercial/railway3.jpg',
        'commercial/railway4.jpg',
      ],
    },
  };

  const SECTORS = {
    institutions: {
      title: 'Institutions',
      subtitle: 'Leaders · IMA · Riverbed',
      projectKeys: ['leaders', 'ima', 'riverbed'],
    },
    hospitality: {
      title: 'Hospitality',
      subtitle: 'F16 · Sri Guru Hotel · Resort',
      projectKeys: ['f16', 'sriguru', 'resort'],
    },
    nonprofit: {
      title: 'Non Profit Org',
      subtitle: 'Anjaneya Temple, Rajanukunte',
      projectKeys: ['temple'],
    },
    commercial: {
      title: 'Commercial',
      subtitle: 'GSK · Anurag',
      projectKeys: ['gsk', 'anurag'],
    },
    peb: {
      title: 'PEB',
      subtitle: 'Railway Quarters, Puttur',
      projectKeys: ['railway'],
    },
  };

  function projectCard(key) {
    const p = PROJECTS[key];
    if (!p || !p.images?.length) return null;
    return {
      key,
      name: p.name,
      cover: p.images[0],
    };
  }

  function sectorProjects(sectorId) {
    const sector = SECTORS[sectorId];
    if (!sector) return [];
    return sector.projectKeys.map(projectCard).filter(Boolean);
  }

  function getProject(key) {
    return PROJECTS[key] || null;
  }

  window.SayHomesCommercial = {
    PROJECTS,
    SECTORS,
    sectorProjects,
    getProject,
  };
})();
