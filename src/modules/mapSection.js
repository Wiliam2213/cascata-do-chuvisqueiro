import L from 'leaflet';

const WAYPOINTS = [
  {
    id: 'chuvisqueiro-base',
    title: 'Cascata do Chuvisqueiro (Base · 76m)',
    coords: [-29.5821, -50.4264],
    zoom: 16,
    tone: 'emerald',
    desc: 'Queda livre de 76m sobre paredão alaranjado com poço esmeralda e prainha rasa. Acesso em ~150m planos.',
  },
  {
    id: 'portaria-camping',
    title: 'Portaria, Estacionamento & Camping',
    coords: [-29.5836, -50.4249],
    zoom: 16,
    tone: 'emerald',
    desc: 'Busque "Camping Cascata do Chuvisqueiro" no GPS para chegar aqui. Banheiros, churrasqueiras e guarita.',
  },
  {
    id: 'mirante-topo',
    title: 'Mirante Superior (Borda do Paredão)',
    coords: [-29.5812, -50.4271],
    zoom: 16,
    tone: 'amber',
    desc: 'Vista panorâmica do alto da queda olhando o Vale do Paranhana. Requer cuidado em pedras molhadas.',
  },
  {
    id: 'tres-quedas',
    title: 'Cascata Três Quedas (Trilha 800m)',
    coords: [-29.5858, -50.4222],
    zoom: 16,
    tone: 'amber',
    desc: 'Trilha moderada de ~20 minutos dentro da mata nativa. Acesso incluído no mesmo ingresso do complexo.',
  },
  {
    id: 'estrada-acesso',
    title: 'Estrada Vicinal (RS-239 → Chuvisqueiro)',
    coords: [-29.5915, -50.4310],
    zoom: 14,
    tone: 'slate',
    desc: 'Trecho final de ~8 km em estrada de chão bem conservada a partir da saída da RS-239 em Riozinho.',
  },
];

const GOOGLE_MAPS_EMBED_URL =
  'https://www.google.com/maps?q=-29.5821,-50.4264&hl=pt-BR&z=15&t=k&output=embed';

export function initMapSection() {
  const mapEl = document.getElementById('chuvisqueiro-map');
  const gmapsWrap = document.getElementById('gmaps-embed-wrap');
  const waypointBtns = Array.from(document.querySelectorAll('.waypoint-card'));
  const overviewBtn = document.getElementById('map-overview-btn');
  const layerBtns = Array.from(document.querySelectorAll('.map-layer-btn'));

  if (!mapEl) return null;

  const map = L.map(mapEl, {
    center: [-29.5835, -50.4252],
    zoom: 15,
    scrollWheelZoom: false,
  });

  const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Esri World Imagery',
      maxZoom: 18,
    }
  );

  const cleanLayer = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; OpenStreetMap &amp; CARTO',
      maxZoom: 19,
    }
  );

  satelliteLayer.addTo(map);

  // Trilhas no mapa
  const baseTrail = L.polyline(
    [WAYPOINTS[1].coords, [-29.5828, -50.4257], WAYPOINTS[0].coords],
    { color: '#34C38B', weight: 4, dashArray: '8 8', opacity: 0.92 }
  ).addTo(map);
  baseTrail.bindTooltip('Trilha plana até a base (~150m)');

  const tresQuedasTrail = L.polyline(
    [WAYPOINTS[1].coords, [-29.5844, -50.4238], [-29.5851, -50.4230], WAYPOINTS[3].coords],
    { color: '#D97236', weight: 4, dashArray: '6 8', opacity: 0.92 }
  ).addTo(map);
  tresQuedasTrail.bindTooltip('Trilha para Cascata Três Quedas (~800m)');

  // Marcadores personalizados pulsantes
  const markers = WAYPOINTS.map((wp, index) => {
    const icon = L.divIcon({
      className: 'chuvisqueiro-marker-wrap',
      html: `<div class="map-pin map-pin-${wp.tone}"><span class="map-pin-ring"></span><span class="map-pin-num">${index + 1}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    const marker = L.marker(wp.coords, { icon }).addTo(map);
    marker.bindPopup(
      `<div class="map-popup"><strong>${wp.title}</strong><p>${wp.desc}</p></div>`,
      { maxWidth: 260 }
    );
    marker.on('click', () => setActiveWaypointCard(index));
    return marker;
  });

  const bounds = L.latLngBounds(WAYPOINTS.slice(0, 4).map((w) => w.coords));

  function setActiveWaypointCard(activeIdx) {
    waypointBtns.forEach((btn) => {
      const idx = Number(btn.getAttribute('data-waypoint'));
      btn.classList.toggle('is-active', idx === activeIdx);
    });
  }

  function focusWaypoint(idx) {
    const wp = WAYPOINTS[idx];
    if (!wp) return;
    setLayerMode('satellite');
    setActiveWaypointCard(idx);
    map.flyTo(wp.coords, wp.zoom, { duration: 1.0 });
    markers[idx].openPopup();
  }

  waypointBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      focusWaypoint(Number(btn.getAttribute('data-waypoint')));
    });
  });

  if (overviewBtn) {
    overviewBtn.addEventListener('click', () => {
      setLayerMode('satellite');
      map.flyToBounds(bounds.pad(0.28), { duration: 1.0 });
      map.closePopup();
    });
  }

  let gmapsLoaded = false;

  function setLayerMode(mode) {
    layerBtns.forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-map-layer') === mode);
    });

    if (mode === 'gmaps') {
      mapEl.classList.add('hidden');
      gmapsWrap.classList.remove('hidden');
      if (!gmapsLoaded) {
        gmapsLoaded = true;
        const iframe = document.createElement('iframe');
        iframe.src = GOOGLE_MAPS_EMBED_URL;
        iframe.title = 'Mapa Google Maps - Cascata do Chuvisqueiro';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        gmapsWrap.appendChild(iframe);
      }
      return;
    }

    gmapsWrap.classList.add('hidden');
    mapEl.classList.remove('hidden');

    if (mode === 'clean') {
      if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
      if (!map.hasLayer(cleanLayer)) cleanLayer.addTo(map);
    } else {
      if (map.hasLayer(cleanLayer)) map.removeLayer(cleanLayer);
      if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
    }

    setTimeout(() => map.invalidateSize(), 60);
  }

  layerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      setLayerMode(btn.getAttribute('data-map-layer'));
    });
  });

  // Garante tamanho correto quando a seção entrar na viewport
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        map.invalidateSize();
      }
    },
    { threshold: 0.1 }
  );
  obs.observe(mapEl);

  return {
    focusWaypoint,
    getMapInfo: () => ({
      center: map.getCenter(),
      zoom: map.getZoom(),
      waypointCount: markers.length,
    }),
  };
}
