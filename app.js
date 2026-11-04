/**
 * RainStop • Human Wetness & Commute Planner Engine
 * Leave-time planner: multi-model + ensemble forecast (Open-Meteo), radar (RainViewer)
 * + relatable human wetness simulator
 * Powered by Leaflet.js Interactive Road Map & Photon Live Global Autocomplete (No Key Required)
 */

// ============================================================================
// 1. DEFAULT LOCATION & CAMPUS / CITY PLACES DATABASE
// ============================================================================

const DEFAULT_COORDS = {
  name: "IIT Kanpur",
  city: "Kanpur, UP",
  lat: 26.5123,
  lon: 80.2329
};

const PLACES_DATABASE = [
  // IIT Kanpur Campus Landmarks
  { name: "IIT Kanpur Main Gate", city: "IIT Kanpur Campus", icon: "🏛️", lat: 26.5123, lon: 80.2329 },
  { name: "PK Kelkar Library, IITK", city: "IIT Kanpur Campus", icon: "📚", lat: 26.5127, lon: 80.2349 },
  { name: "Academic Area / CSE Dept", city: "IIT Kanpur Campus", icon: "💻", lat: 26.5135, lon: 80.2355 },
  { name: "Hall 12 / 13, IITK", city: "IIT Kanpur Hostels", icon: "🏢", lat: 26.5075, lon: 80.2295 },
  { name: "Hall 1 / 2 / 3 / 4, IITK", city: "IIT Kanpur Hostels", icon: "🏢", lat: 26.5110, lon: 80.2315 },
  { name: "Hall 7 / 8 / 9, IITK", city: "IIT Kanpur Hostels", icon: "🏢", lat: 26.5090, lon: 80.2330 },
  { name: "OAT / Pronite Grounds, IITK", city: "IIT Kanpur Campus", icon: "🎭", lat: 26.5150, lon: 80.2360 },
  { name: "Student Activity Center (SAC)", city: "IIT Kanpur Campus", icon: "🏀", lat: 26.5140, lon: 80.2370 },
  { name: "Airstrip / Flight Lab, IITK", city: "IIT Kanpur Campus", icon: "✈️", lat: 26.5200, lon: 80.2300 },
  { name: "Health Centre / Hospital, IITK", city: "IIT Kanpur Campus", icon: "🏥", lat: 26.5120, lon: 80.2375 },
  { name: "Shopping Complex / Canteen", city: "IIT Kanpur Campus", icon: "☕", lat: 26.5105, lon: 80.2350 },
  
  // Kanpur City & Surroundings
  { name: "Kalyanpur GT Road", city: "Kanpur", icon: "🛣️", lat: 26.4950, lon: 80.2450 },
  { name: "Kanpur Central Station", city: "Kanpur", icon: "🚉", lat: 26.4547, lon: 80.3507 },
  { name: "Z Square Mall, Kanpur", city: "Kanpur", icon: "🛍️", lat: 26.4718, lon: 80.3524 },
  { name: "Bithoor Ganga Ghat", city: "Kanpur", icon: "🌊", lat: 26.6150, lon: 80.2760 },
  { name: "Rawatpur Station", city: "Kanpur", icon: "🚇", lat: 26.4780, lon: 80.3010 }
];

const SCENARIOS = {
  live: {
    name: "Live Forecast",
    skyTitle: "Live Sky Status",
    skySubtitle: "Loading forecast models...",
    skyIcon: "🌤️",
    stopMinutes: 0,
    rainProfile: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    windSpeed: 7,
    puddleRisk: "Dry (< 1 cm)",
    rainIntensity: "dry_now",
    lightning: false,
    adviceHeadline: "Safe conditions outdoors",
    adviceDesc: "Live atmospheric radar shows dry/gentle conditions in your area.",
    routePockets: [
      { name: "Main Gate", dist: "0.0 km", rain: "dry", text: "0 mm/h" },
      { name: "SAC Circle", dist: "0.8 km", rain: "dry", text: "0 mm/h" },
      { name: "Library", dist: "1.8 km", rain: "dry", text: "0 mm/h" }
    ],
    routeAlert: "🟢 Campus Alert: Normal campus roads. Safe for walking or cycling without raincoat."
  },
  monsoon: {
    name: "Monsoon Cloudburst (Simulation)",
    skyTitle: "Heavy Downpour",
    skySubtitle: "Bucket rain. Severe road puddle accumulation.",
    skyIcon: "⛈️",
    stopMinutes: 18,
    rainProfile: [14.5, 12.0, 9.5, 6.0, 3.2, 1.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0],
    windSpeed: 28,
    puddleRisk: "High (5-8 cm)",
    rainIntensity: "heavy",
    lightning: true,
    adviceHeadline: "Wait 18 minutes for 1 Chai",
    adviceDesc: "Right now you'll get soaked instantly. Waiting just 18 minutes lets the storm pass completely.",
    routePockets: [
      { name: "Main Gate", dist: "0.0 km", rain: "moderate", text: "4 mm/h" },
      { name: "SAC Circle", dist: "0.8 km", rain: "heavy", text: "14 mm/h" },
      { name: "Library", dist: "1.8 km", rain: "heavy", text: "12 mm/h" }
    ],
    routeAlert: "⚠️ Campus Alert: Waterlogged avenues near SAC and Hall 12. Wait 18m to walk dry."
  },
  drizzle: {
    name: "Light Campus Drizzle",
    skyTitle: "Misty Drizzle",
    skySubtitle: "Gentle mist. Campus roads damp but no puddles.",
    skyIcon: "🌦️",
    stopMinutes: 35,
    rainProfile: [1.2, 1.0, 0.8, 0.8, 0.6, 0.5, 0.4, 0.2, 0.2, 0.1, 0.0, 0.0],
    windSpeed: 8,
    puddleRisk: "Low (< 1 cm)",
    rainIntensity: "light",
    lightning: false,
    adviceHeadline: "Safe to walk with a Hoodie",
    adviceDesc: "Very gentle drizzle. An umbrella keeps you 100% dry, or just pull up a hood.",
    routePockets: [
      { name: "Main Gate", dist: "0.0 km", rain: "light", text: "1.2 mm/h" },
      { name: "SAC Circle", dist: "0.8 km", rain: "light", text: "0.8 mm/h" },
      { name: "Library", dist: "1.8 km", rain: "dry", text: "0 mm/h" }
    ],
    routeAlert: "🟢 Campus Alert: Uniform light mist along path. No puddle splash hazard."
  },
  sideways: {
    name: "Gale & Sideways Rain",
    skyTitle: "Wind-Driven Storm",
    skySubtitle: "38 km/h gusts. Rain hitting at 45-degree angle.",
    skyIcon: "💨",
    stopMinutes: 32,
    rainProfile: [7.5, 8.0, 7.0, 5.5, 4.0, 2.8, 1.5, 0.8, 0.2, 0.0, 0.0, 0.0],
    windSpeed: 38,
    puddleRisk: "Moderate (2-4 cm)",
    rainIntensity: "moderate",
    lightning: false,
    adviceHeadline: "Umbrellas Will Turn Inside-Out",
    adviceDesc: "High wind gusts blow rain under umbrellas. Raincoat or auto-rickshaw recommended.",
    routePockets: [
      { name: "Main Gate", dist: "0.0 km", rain: "heavy", text: "8 mm/h" },
      { name: "SAC Circle", dist: "0.8 km", rain: "heavy", text: "7.5 mm/h" },
      { name: "Library", dist: "1.8 km", rain: "moderate", text: "5 mm/h" }
    ],
    routeAlert: "💨 Campus Alert: Extreme wind gusts (38 km/h) near Airstrip. Do not use umbrella."
  },
  clearing: {
    name: "Clear Dry Window",
    skyTitle: "Dry Sky Window",
    skySubtitle: "Clear overhead right now across campus.",
    skyIcon: "🌤️",
    stopMinutes: 0,
    rainProfile: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    windSpeed: 10,
    puddleRisk: "Dry",
    rainIntensity: "dry_now",
    lightning: false,
    adviceHeadline: "100% Clear Sky on Campus",
    adviceDesc: "Safe to step out anywhere on campus in sneakers. Zero rain detected.",
    routePockets: [
      { name: "Main Gate", dist: "0.0 km", rain: "dry", text: "0 mm/h" },
      { name: "SAC Circle", dist: "0.8 km", rain: "dry", text: "0 mm/h" },
      { name: "Library", dist: "1.8 km", rain: "dry", text: "0 mm/h" }
    ],
    routeAlert: "🟢 Campus Alert: 100% dry right now across all 1.8 km."
  }
};

const appState = {
  activeScenario: 'live',
  currentScenarioData: { ...SCENARIOS.live },
  transportMode: 'walk', // 'walk' | 'scooter' | 'car'
  gear: {
    umbrella: false,
    raincoat: false,
    shoeCovers: false,
    bagCover: false
  },
  departureDelayMins: 0,
  origin: "IIT Kanpur Main Gate",
  originCoords: { lat: 26.5123, lon: 80.2329 },
  dest: "PK Kelkar Library, IITK",
  destCoords: { lat: 26.5127, lon: 80.2349 },
  routeDistanceKm: 1.8,
  mapPinMode: 'origin', // 'origin' | 'dest'
  weatherEngine: 'openmeteo',
  groundReport: null,      // { type: 'rain'|'dry', at: ms } — expires after 30 min
  forecastBundle: null,    // { lat, lon, a0, det, detAt, ens, ensAt } — see fetchForecastExtras
  leavePlan: null,         // output of computeLeavePlan, recomputed on every updateUI
  radar: null,             // { status: 'echo'|'none'|'unavailable'|'stale', frameTime, nearby }
  radarMeta: null,         // { host, frame, frames: [{time, path}] (last ~2 h), ageMin } from RainViewer
  metrics: null,           // output of parseMetrics (+ lat/lon) — live conditions, never part of SCENARIOS
  grid: null,              // output of parseGridResponse (+ key, dataUrls) — experimental forecast rain map
  gridFailed: false,
  mapFocus: 'route',       // 'route' = fit the trip on redraw | 'radar' = keep the radar view (phones) | 'india' = all-India view
  india: { field: null, failure: null, failed: false },  // India-wide model wind/pressure field (section 8.65)
  cyclones: { events: [], geom: {}, fetchedAt: 0, failed: false, failure: null, asOf: 0 }, // GDACS (section 8.66)
  layers: (() => {
    // Wind + pressure default OFF: each India fetch is 289 Open-Meteo calls (shared campus IPs).
    const defaults = { radar: true, satellite: false, grid: true, route: true, wind: false, pressure: false, cyclones: true };
    try {
      const saved = JSON.parse(localStorage.getItem('rainstop_layers_v1') || 'null');
      if (saved && typeof saved === 'object') {
        Object.keys(defaults).forEach(k => { if (typeof saved[k] === 'boolean') defaults[k] = saved[k]; });
      }
    } catch (e) { /* private mode / corrupt value: use defaults */ }
    return defaults;
  })(),
  dampOk: (() => { try { return localStorage.getItem('rainstop_damp_ok') === '1'; } catch (e) { return false; } })()
};

// True while the phone "map-first" layout is active (body.m-map). Safe in test sandboxes
// that have no document.body.
function isMobileMap() {
  return !!(document.body && document.body.classList && document.body.classList.contains('m-map'));
}

// ============================================================================
// 2. CANVAS PARTICLE RAIN SYSTEM
// ============================================================================

class RainEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.splashes = [];
    this.maxDrops = 240;
    this.wind = 2;
    this.intensity = 'light';
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // The draw loop stops while hidden / empty (no idle rAF); resume when visible again.
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.start(); });
    this.initDrops();
    this.start();
  }

  start() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => { this.rafId = null; this.animate(); });
  }

  resize() {
    // Mobile browsers fire resize continuously while scrolling (address bar shows/hides).
    // Re-allocating the canvas each time makes scrolling stutter, so ignore small
    // height-only changes.
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.width === w && this.height && Math.abs(this.height - h) < 160) return;
    const crossedPhoneWidth = this.width !== undefined && (this.width <= 768) !== (w <= 768);
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    // Rotating a phone across the 768px breakpoint changes the drop budget
    if (crossedPhoneWidth && this.intensity) this.setIntensity(this.intensity, this.windSpeed);
  }

  setIntensity(level, windSpeed = 15) {
    this.intensity = level;
    this.windSpeed = windSpeed;
    this.wind = (windSpeed - 10) * 0.15;
    let drops = 0;
    if (level === 'heavy') drops = 320;
    else if (level === 'moderate') drops = 180;
    else if (level === 'light') drops = 80;
    // Phones: far fewer drops (full-screen redraw every frame is costly); none at all
    // if the user asked the OS to reduce motion.
    // The map-first phone layout hides the canvas entirely, so draw nothing there.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || isMobileMap()) drops = 0;
    else if (this.width <= 768) drops = Math.round(drops * 0.3);
    if (drops === this.maxDrops && this.drops.length === drops) return; // unchanged
    this.maxDrops = drops;
    this.initDrops();
    this.start();
  }

  initDrops() {
    this.drops = [];
    for (let i = 0; i < this.maxDrops; i++) {
      this.drops.push({
        x: Math.random() * (this.width + 200) - 100,
        y: Math.random() * this.height,
        length: Math.random() * 16 + 10,
        speed: Math.random() * 10 + 12,
        opacity: Math.random() * 0.4 + 0.2
      });
    }
  }

  triggerLightning() {
    const el = document.getElementById('lightning');
    if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 90);
    setTimeout(() => {
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 60);
    }, 140);
  }

  animate() {
    // Nothing to draw (or app in the background): clear once and stop the loop entirely
    // instead of spinning requestAnimationFrame; start() resumes it.
    if (document.hidden || (this.drops.length === 0 && this.splashes.length === 0)) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.lineWidth = 1.5;
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${d.opacity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(d.x, d.y);
      this.ctx.lineTo(d.x + this.wind * 2, d.y + d.length);
      this.ctx.stroke();

      d.y += d.speed;
      d.x += this.wind;

      if (d.y > this.height - 10) {
        if (Math.random() > 0.75 && this.splashes.length < 40) {
          this.splashes.push({
            x: d.x,
            y: this.height - 5,
            radius: 1,
            maxRadius: Math.random() * 5 + 2,
            opacity: 0.5
          });
        }
        d.y = -20;
        d.x = Math.random() * (this.width + 200) - 100;
      }
    }

    for (let j = this.splashes.length - 1; j >= 0; j--) {
      const s = this.splashes[j];
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${s.opacity})`;
      this.ctx.beginPath();
      this.ctx.ellipse(s.x, s.y, s.radius * 2, s.radius * 0.6, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      s.radius += 0.5;
      s.opacity -= 0.04;
      if (s.opacity <= 0) {
        this.splashes.splice(j, 1);
      }
    }

    this.start();
  }
}

// ============================================================================
// 3. LEAFLET INTERACTIVE ROAD MAP ENGINE
// ============================================================================

let mapInstance = null;
let originMarker = null;
let destMarker = null;
let routeLineLayer = null;
let osmBaseLayer = null;   // desktop basemap (dark-filtered in CSS)

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function createCustomPin(color, label) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      background: ${color};
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 14px ${color}, 0 2px 6px rgba(0,0,0,0.8);
      border: 2px solid #ffffff;
    ">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

function initInteractiveMap() {
  const mapContainer = document.getElementById('routeMap');
  if (!mapContainer || typeof L === 'undefined') return;

  if (mapInstance) return;

  // Initialize Leaflet Map centered on IIT Kanpur
  mapInstance = L.map('routeMap', {
    center: [DEFAULT_COORDS.lat, DEFAULT_COORDS.lon],
    zoom: 15,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
  ensureMapPanes(); // weather overlay panes must exist before any overlay is created

  // 100% Free Official OpenStreetMap Tiles (Zero Watermarks • No Key Required).
  // Same free tiles on phones and desktop (dark look via CSS filter on the tile pane).
  osmBaseLayer = L.tileLayer(OSM_TILES, {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mapInstance);

  // Add draggable Start (🟢) and Destination (🔴) pins
  originMarker = L.marker([appState.originCoords.lat, appState.originCoords.lon], {
    draggable: true,
    icon: createCustomPin('#10b981', 'A')
  }).addTo(mapInstance);

  destMarker = L.marker([appState.destCoords.lat, appState.destCoords.lon], {
    draggable: true,
    icon: createCustomPin('#ef4444', 'B')
  }).addTo(mapInstance);

  originMarker.bindTooltip("🟢 Start (Drag to change)", { permanent: false });
  destMarker.bindTooltip("🔴 Destination (Drag to change)", { permanent: false });

  // Marker drag events
  originMarker.on('dragend', async (e) => {
    const pos = e.target.getLatLng();
    appState.originCoords = { lat: pos.lat, lon: pos.lng };
    await reverseGeocode(pos.lat, pos.lng, 'origin');
    fetchAndDrawRoute();
  });

  destMarker.on('dragend', async (e) => {
    const pos = e.target.getLatLng();
    appState.destCoords = { lat: pos.lat, lon: pos.lng };
    await reverseGeocode(pos.lat, pos.lng, 'dest');
    fetchAndDrawRoute();
  });

  // Map Click Listener: automatically moves the closer pin. Not on the phone map, where
  // taps are for panning/zooming the radar (pins can still be dragged).
  mapInstance.on('click', async (e) => {
    if (isMobileMap()) return;
    const { lat, lng } = e.latlng;
    const distToOrig = haversineDistance(lat, lng, appState.originCoords.lat, appState.originCoords.lon);
    const distToDest = haversineDistance(lat, lng, appState.destCoords.lat, appState.destCoords.lon);

    if (distToOrig < distToDest) {
      originMarker.setLatLng([lat, lng]);
      appState.originCoords = { lat, lon: lng };
      await reverseGeocode(lat, lng, 'origin');
    } else {
      destMarker.setLatLng([lat, lng]);
      appState.destCoords = { lat, lon: lng };
      await reverseGeocode(lat, lng, 'dest');
    }
    fetchAndDrawRoute();
  });

  // Draw initial route path
  fetchAndDrawRoute();
}

async function fetchAndDrawRoute() {
  const o = appState.originCoords;
  // Weather is fetched for the start point: refetch when it moved to a new spot.
  if (appState.activeScenario === 'live' && appState.forecastBundle && !sameSpot(appState.forecastBundle, o)) {
    fetchLiveOpenMeteo(o.lat, o.lon, appState.origin || 'Start point');
  }
  const d = appState.destCoords;
  const mode = appState.transportMode === 'car' ? 'car' : appState.transportMode === 'scooter' ? 'bike' : 'foot';

  try {
    const url = `https://routing.openstreetmap.de/routed-${mode}/route/v1/driving/${o.lon},${o.lat};${d.lon},${d.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.code === 'Ok' && json.routes && json.routes[0]) {
      const route = json.routes[0];
      const distKm = +(route.distance / 1000).toFixed(1);
      appState.routeDistanceKm = distKm;

      if (routeLineLayer && mapInstance) {
        mapInstance.removeLayer(routeLineLayer);
      }

      // Draw glowing cyan route line (kept off the map while the "Trip route" layer is off)
      routeLineLayer = L.geoJSON(route.geometry, {
        style: {
          color: '#38bdf8',
          weight: 5,
          opacity: 0.9,
          dashArray: '2, 6'
        }
      });
      if (appState.layers.route) routeLineLayer.addTo(mapInstance);

      // On the phone radar view / all-India view the map stays put; "Trip" fits the route on demand.
      if (appState.mapFocus === 'route') fitRouteBounds();
    } else {
      drawFallbackRoute();
    }
  } catch (err) {
    drawFallbackRoute();
  }

  updateUI();
}

function drawFallbackRoute() {
  const o = appState.originCoords;
  const d = appState.destCoords;
  const dist = haversineDistance(o.lat, o.lon, d.lat, d.lon);
  appState.routeDistanceKm = +(dist * 1.3).toFixed(1);

  if (routeLineLayer && mapInstance) {
    mapInstance.removeLayer(routeLineLayer);
  }

  if (mapInstance) {
    routeLineLayer = L.polyline([[o.lat, o.lon], [d.lat, d.lon]], {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.8
    });
    if (appState.layers.route) routeLineLayer.addTo(mapInstance);
    if (appState.mapFocus === 'route') fitRouteBounds();
  }
}

// Fit the trip into view. On phones keep it clear of the top bar and the bottom sheet.
function fitRouteBounds() {
  if (!mapInstance || !routeLineLayer || typeof routeLineLayer.getBounds !== 'function') return;
  const opts = isMobileMap()
    ? { paddingTopLeft: [24, 84], paddingBottomRight: [24, (sheetState.visible || 160) + 24] }
    : { padding: [30, 30] };
  mapInstance.fitBounds(routeLineLayer.getBounds(), opts);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function reverseGeocode(lat, lon, stateKey) {
  try {
    const input = stateKey === 'origin' ? document.getElementById('inputOrigin') : document.getElementById('inputDest');
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json && json.display_name) {
      const parts = json.display_name.split(',');
      const shortName = parts.slice(0, 2).join(',').trim();
      input.value = shortName;
      appState[stateKey] = shortName;
    }
  } catch (e) {}
}

// ============================================================================
// 4. HUMAN WETNESS ENGINE (PHYSICS & RELATABILITY)
// ============================================================================

// Pure wetness model: rain rate (mm/h) + mode + gear -> tier & body zones.
// Shared by the avatar and the leave-time engine so the two can never disagree.
function computeWetness(rainRateAtDeparture, opts) {
  const mode = opts.mode;
  const gear = opts.gear;
  const isHighWind = opts.windSpeed > 30;
  const puddleHigh = !!opts.puddleHigh;

  const bodyStatus = {
    head: 'dry',
    torso: 'dry',
    backpack: 'dry',
    legs: 'dry',
    shoes: 'dry'
  };

  if (rainRateAtDeparture === 0) {
    bodyStatus.head = 'dry';
    bodyStatus.torso = 'dry';
    bodyStatus.backpack = 'dry';
    bodyStatus.legs = 'dry';
    bodyStatus.shoes = 'dry';
  } else if (mode === 'car') {
    // 100% Enclosed Automobile Cabin: fully shielded from rain & road spray
    bodyStatus.head = 'dry';
    bodyStatus.torso = 'dry';
    bodyStatus.backpack = 'dry';
    bodyStatus.legs = 'dry';
    bodyStatus.shoes = 'dry';
  } else if (mode === 'scooter') {
    // 2-Wheeler Transit: Umbrellas impossible, driving at 25 km/h into rain
    if (gear.raincoat) {
      bodyStatus.head = 'dry';
      bodyStatus.torso = 'dry';
      bodyStatus.legs = 'dry';
    } else {
      bodyStatus.head = rainRateAtDeparture > 2 ? 'soaked' : 'damp';
      bodyStatus.torso = rainRateAtDeparture > 1 ? 'soaked' : 'damp';
      bodyStatus.legs = 'soaked';
    }
    bodyStatus.backpack = (gear.bagCover || gear.raincoat) ? 'dry' : (rainRateAtDeparture > 2 ? 'soaked' : 'damp');
    bodyStatus.shoes = gear.shoeCovers ? 'dry' : 'soaked';
  } else {
    // Pedestrian Walking Mode
    // Head:
    if (gear.raincoat) {
      bodyStatus.head = 'dry';
    } else if (gear.umbrella) {
      bodyStatus.head = isHighWind ? 'damp' : 'dry';
    } else {
      bodyStatus.head = rainRateAtDeparture > 3 ? 'soaked' : 'damp';
    }

    // Torso:
    if (gear.raincoat) {
      bodyStatus.torso = 'dry';
    } else if (gear.umbrella) {
      bodyStatus.torso = (isHighWind && rainRateAtDeparture > 4) ? 'damp' : 'dry';
    } else {
      bodyStatus.torso = rainRateAtDeparture > 2 ? 'soaked' : 'damp';
    }

    // Backpack:
    if (gear.bagCover || gear.raincoat) {
      bodyStatus.backpack = 'dry';
    } else {
      bodyStatus.backpack = rainRateAtDeparture > 3 ? 'soaked' : 'damp';
    }

    // Legs:
    if (gear.raincoat) {
      bodyStatus.legs = rainRateAtDeparture > 8 ? 'damp' : 'dry';
    } else {
      if (rainRateAtDeparture > 5) {
        bodyStatus.legs = 'soaked';
      } else if (rainRateAtDeparture > 1) {
        bodyStatus.legs = 'damp';
      } else {
        bodyStatus.legs = 'dry';
      }
    }

    // Shoes:
    if (gear.shoeCovers) {
      bodyStatus.shoes = 'dry';
    } else {
      if (rainRateAtDeparture > 3 || (rainRateAtDeparture > 0 && puddleHigh)) {
        bodyStatus.shoes = 'soaked';
      } else if (rainRateAtDeparture > 0.5) {
        bodyStatus.shoes = 'damp';
      } else {
        bodyStatus.shoes = 'dry';
      }
    }
  }

  let tier = 0;
  let tierHeadline = "Bone Dry Arrival";
  let tierSubtext = "Wear your fresh white sneakers. Safe commute with zero rain worries.";
  let badgeColor = "var(--tier-0)";

  const soakedCount = Object.values(bodyStatus).filter(s => s === 'soaked').length;
  const dampCount = Object.values(bodyStatus).filter(s => s === 'damp').length;

  if (rainRateAtDeparture === 0) {
    tier = 0;
    tierHeadline = "Bone Dry & Crisp";
    tierSubtext = "Zero rain drops. White sneakers are 100% safe.";
    badgeColor = "var(--tier-0)";
  } else if (soakedCount >= 3 || (bodyStatus.torso === 'soaked' && bodyStatus.head === 'soaked')) {
    tier = 4;
    tierHeadline = "Shower Outside / Drenched";
    tierSubtext = "Like jumping in a pool with clothes on. Do not step out without cab or full suit.";
    badgeColor = "var(--tier-4)";
  } else if (soakedCount >= 1 || (bodyStatus.shoes === 'soaked' && bodyStatus.legs === 'soaked')) {
    tier = 3;
    tierHeadline = "Change of Clothes Needed";
    tierSubtext = "Soaked jeans & squishy socks. Bring spare clothes if going to labs.";
    badgeColor = "var(--tier-3)";
  } else if (bodyStatus.shoes === 'soaked' || bodyStatus.legs === 'damp' || bodyStatus.shoes === 'damp') {
    tier = 2;
    tierHeadline = "Soggy Socks & Wet Jeans";
    tierSubtext = "Torso stays dry with umbrella, but puddle splashes dampen your shoes.";
    badgeColor = "var(--tier-2)";
  } else if (dampCount >= 1) {
    tier = 1;
    tierHeadline = "Just a Light Sprinkle";
    tierSubtext = "Hair gets slightly damp. A light hoodie or jacket is plenty.";
    badgeColor = "var(--tier-1)";
  }

  return {
    tier,
    tierHeadline,
    tierSubtext,
    badgeColor,
    bodyStatus
  };
}

function calculateWetnessAndConsequences() {
  const data = appState.currentScenarioData;
  const delay = appState.departureDelayMins;
  const tripDurationMins = tripMinutes(appState.routeDistanceKm, appState.transportMode);

  // Rain expected during the trip if leaving after `delay` minutes: from the leave plan
  // (peak over the trip window) when available, else the 60-min profile bucket.
  let rainRateAtDeparture = planExpectedRate(appState.leavePlan, delay);
  if (rainRateAtDeparture === null) {
    const bucketIdx = Math.min(Math.floor(delay / 5), data.rainProfile.length - 1);
    rainRateAtDeparture = data.rainProfile[bucketIdx] || 0;
  }

  const result = computeWetness(rainRateAtDeparture, {
    mode: appState.transportMode,
    gear: appState.gear,
    windSpeed: data.windSpeed,
    puddleHigh: rainRateAtDeparture > 0 && !!data.puddleRisk && data.puddleRisk.includes('High')
  });
  result.rainRateAtDeparture = rainRateAtDeparture;
  result.tripDurationMins = tripDurationMins;
  return result;
}

// ============================================================================
// 4.2 LEAVE-TIME ENGINE ("When can I leave and arrive dry enough?")
// ============================================================================
// For every candidate departure (every 5 min over the next 6 h) we check the rain over
// the WHOLE trip window [departure, departure + trip duration] in every forecast model
// and ensemble member, and estimate the probability the trip stays within what the
// user's mode + gear can tolerate.
//
// Series shape (absolute unix seconds, so it is timezone-proof and ages correctly):
//   { group: 'det'|'ens', system: string, stepSec: number, endTimes: number[], rates: (number|null)[] }
// A value at end time T is the mean rate (mm/h) over (T - stepSec, T].

const LEAVE_STEP_MIN = 5;
const LEAVE_HORIZON_MIN = 360;
const GOOD_P = 0.8;
const FAIR_P = 0.6;
const MIN_WAIT_GAIN = 0.15;    // waiting must improve the chance by >= 15 points to be worth it
const ENS_PEAK_FACTOR = 1.5;   // an hourly mean of 0.3 mm/h can hide a short heavier burst
const MODE_SPEED_KMH = { walk: 4.5, scooter: 25.0, car: 18.0 };
const ACCEPT_TIER_STRICT = 1;  // bone dry or light sprinkle
const ACCEPT_TIER_RELAXED = 2; // damp socks / jeans OK
const GROUND_REPORT_TTL_MS = 30 * 60000;

function tripMinutes(distKm, mode) {
  return Math.max(2, Math.round((distKm / (MODE_SPEED_KMH[mode] || 4.5)) * 60));
}

// Largest rain rate (mm/h) the wetness model keeps at or below `acceptTier` for this
// mode + gear. 0 = only fully dry slots are OK; Infinity = rain never matters (car).
function toleranceRateFor(mode, gear, windSpeed, acceptTier) {
  let tol = 0;
  for (let i = 1; i <= 200; i++) {
    const r = i / 10;
    if (computeWetness(r, { mode, gear, windSpeed, puddleHigh: r > 4 }).tier > acceptTier) return tol;
    tol = r;
  }
  return Infinity;
}

function rateAt(series, tSec) {
  const { endTimes, rates, stepSec } = series;
  let lo = 0, hi = endTimes.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (endTimes[mid] < tSec) lo = mid + 1; else hi = mid;
  }
  if (lo >= endTimes.length || endTimes[lo] - stepSec >= tSec) return null;
  const v = rates[lo];
  return (v === null || v === undefined || !Number.isFinite(v)) ? null : v;
}

function median(arr) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function computeLeavePlan(seriesList, opts) {
  const { nowSec, tripMin, tol } = opts;
  const obs = opts.obs || {};
  if (!seriesList || !seriesList.length) return null;

  const nB = Math.max(1, Math.ceil(tripMin / LEAVE_STEP_MIN));
  const nCand = LEAVE_HORIZON_MIN / LEAVE_STEP_MIN;
  const nBuckets = nCand + nB;
  const sm = (ok, n) => (ok + 0.25) / (n + 0.5);

  // Pre-sample every series at 5-min bucket midpoints (piecewise constant, no smearing).
  const sample = (s) => {
    const out = new Array(nBuckets);
    for (let b = 0; b < nBuckets; b++) out[b] = rateAt(s, nowSec + b * 300 + 150);
    return out;
  };
  const det = seriesList.filter(s => s.group === 'det').map(s => ({ s, r: sample(s) }));
  const ensBySystem = {};
  seriesList.filter(s => s.group === 'ens').forEach(s => {
    (ensBySystem[s.system] = ensBySystem[s.system] || []).push({ s, r: sample(s) });
  });
  const ensSystems = Object.keys(ensBySystem);

  // Peak rate over the trip window, or null if any bucket is missing. A member with a
  // gap in the window is excluded (whether wet or dry) so gaps can't bias the result.
  const peak = (r, k) => {
    let p = 0;
    for (let b = k; b < k + nB; b++) { if (r[b] === null) return null; p = Math.max(p, r[b]); }
    return p;
  };
  // true = trip OK, false = too wet, null = excluded (data gap)
  const memberOK = (pk, isEns) => {
    if (pk === null) return null;
    return ((isEns && tol > 0) ? pk * ENS_PEAK_FACTOR : pk) <= tol;
  };
  const percentile = (arr, q) => {
    const a = [...arr].sort((x, y) => x - y);
    return a[Math.min(a.length - 1, Math.floor(q * a.length))];
  };

  const candidates = [];
  for (let k = 0; k < nCand; k++) {
    let okD = 0, nD = 0;
    const peaks = [];
    det.forEach(({ r }) => {
      const pk = peak(r, k);
      const st = memberOK(pk, false);
      if (st === null) return;
      nD++; if (st) okD++;
      peaks.push(pk);
    });
    const sysProbs = [];
    ensSystems.forEach(sys => {
      let ok = 0, n = 0;
      ensBySystem[sys].forEach(({ r }) => {
        const pk = peak(r, k);
        const st = memberOK(pk, true);
        if (st === null) return;
        n++; if (st) ok++;
        peaks.push(tol > 0 ? pk * ENS_PEAK_FACTOR : pk);
      });
      if (n) sysProbs.push(sm(ok, n));
    });
    const pDet = nD ? sm(okD, nD) : null;
    const pEns = sysProbs.length ? sysProbs.reduce((a, b) => a + b, 0) / sysProbs.length : null;
    if (pDet === null && pEns === null) break; // end of usable forecast horizon

    let pOk = (pDet !== null && pEns !== null) ? 0.5 * pDet + 0.5 * pEns : (pDet !== null ? pDet : pEns);

    // Observations only matter near "now" and decay with time.
    // Influence decays from the time of the observation, not from "now".
    const tMin = k * LEAVE_STEP_MIN;
    const sinceObs = (obs.ageMin || 0) + tMin;
    let obsRainWeight = 0;
    if (obs.rainTau) {
      const exceed = tol === 0 ? 0.95 : tol < 1 ? 0.8 : tol < 2.5 ? 0.55 : tol < 7.6 ? 0.3 : 0.1;
      obsRainWeight = Math.exp(-sinceObs / obs.rainTau);
      pOk = Math.min(pOk, 1 - exceed * obsRainWeight);
    } else if (obs.dry) {
      pOk = Math.max(pOk, 0.9 * Math.exp(-(sinceObs + tripMin / 2) / 20));
    }
    pOk = Math.min(0.97, Math.max(0.03, pOk));

    // "Rain if it rains as forecast": 75th percentile of all member peaks (ensemble scaled
    // like in the OK test), at least light rain while an observation says it's raining.
    let expRate = peaks.length ? percentile(peaks, 0.75) : 0;
    if (obsRainWeight > 0.5) expRate = Math.max(expRate, 1.0);
    candidates.push({ offsetMin: tMin, pOk, pDet, pEns, expRate: +expRate.toFixed(1) });
  }
  if (!candidates.length) return null;

  const firstGood = candidates.find(c => c.pOk >= GOOD_P) || null;
  let best = candidates[0];
  candidates.forEach(c => { if (c.pOk > best.pOk + 0.02) best = c; });

  const windows = [];
  let run = null;
  candidates.forEach(c => {
    if (c.pOk >= GOOD_P) {
      if (!run) run = { startMin: c.offsetMin, endMin: c.offsetMin + LEAVE_STEP_MIN, minP: c.pOk };
      else { run.endMin = c.offsetMin + LEAVE_STEP_MIN; run.minP = Math.min(run.minP, c.pOk); }
    } else if (run) { windows.push(run); run = null; }
  });
  if (run) windows.push(run);

  // Recommendation: wait for a good window only if it is close or clearly better;
  // a "fair" chance now beats waiting hours for a few extra points.
  const nowC = candidates[0];
  let recommended;
  if (nowC.pOk >= GOOD_P) recommended = { offsetMin: 0, pOk: nowC.pOk, kind: 'now' };
  else if (firstGood && (firstGood.offsetMin <= 30 || firstGood.pOk - nowC.pOk >= MIN_WAIT_GAIN)) {
    recommended = { offsetMin: firstGood.offsetMin, pOk: firstGood.pOk, kind: 'wait' };
  } else if (nowC.pOk >= FAIR_P) recommended = { offsetMin: 0, pOk: nowC.pOk, kind: 'now-fair' };
  else if (firstGood) recommended = { offsetMin: firstGood.offsetMin, pOk: firstGood.pOk, kind: 'wait' };
  else if (best.pOk - nowC.pOk >= MIN_WAIT_GAIN) recommended = { offsetMin: best.offsetMin, pOk: best.pOk, kind: 'best-bet' };
  else recommended = { offsetMin: 0, pOk: nowC.pOk, kind: 'no-better' };

  const chosen = candidates[recommended.offsetMin / LEAVE_STEP_MIN];
  const levels = ['Low', 'Fair', 'Good', 'High'];
  let lvl = chosen.pOk >= 0.9 ? 3 : chosen.pOk >= GOOD_P ? 2 : chosen.pOk >= FAIR_P ? 1 : 0;
  const notes = [];
  if (chosen.pDet !== null && chosen.pEns !== null && Math.abs(chosen.pDet - chosen.pEns) > 0.4) {
    notes.push('models disagree'); lvl = Math.max(0, lvl - 1);
  }
  if (!ensSystems.length && det.length <= 1) { notes.push('single model'); lvl = Math.min(lvl, 0); }
  else if (!ensSystems.length) notes.push('no ensemble');
  else if (!det.length) notes.push('hourly resolution');
  if (obs.rainTau) notes.push(obs.source === 'radar' ? 'rain on radar now' : 'rain reported now');
  if (obs.dry) notes.push('dry reported now');
  if (opts.dataAgeMin > 30) {
    notes.push(`forecast data ${Math.round(opts.dataAgeMin)} min old`);
    lvl = opts.dataAgeMin > 90 ? 0 : Math.max(0, lvl - 1);
  }

  return {
    nowSec, tripMin, tol,
    sources: { det: det.length, ens: ensSystems.reduce((a, s) => a + ensBySystem[s].length, 0), ensSystems: ensSystems.length },
    candidates,
    leaveNowOk: candidates[0].pOk >= GOOD_P,
    earliestGood: firstGood ? { offsetMin: firstGood.offsetMin, pOk: firstGood.pOk } : null,
    best: { offsetMin: best.offsetMin, pOk: best.pOk },
    recommended,
    windows: windows.slice(0, 3),
    confidence: levels[lvl],
    notes,
    horizonMin: candidates.length * LEAVE_STEP_MIN,
    beyondHorizon: !firstGood
  };
}

function planCandidateAt(plan, delayMin) {
  if (!plan || !plan.candidates.length) return null;
  const k = Math.min(plan.candidates.length - 1, Math.max(0, Math.round(delayMin / LEAVE_STEP_MIN)));
  return plan.candidates[k];
}

function planExpectedRate(plan, delayMin) {
  const c = planCandidateAt(plan, delayMin);
  return c ? c.expRate : null;
}

// Lab simulations: 12 x 5-min profile, dry afterwards.
function seriesFromScenario(data, nowSec) {
  const start = nowSec - (nowSec % 300);
  const endTimes = [], rates = [];
  for (let i = 0; i < (LEAVE_HORIZON_MIN + 300) / 5; i++) {
    endTimes.push(start + (i + 1) * 300);
    rates.push(i < data.rainProfile.length ? data.rainProfile[i] : 0);
  }
  return { group: 'det', system: 'scenario', stepSec: 300, endTimes, rates };
}

function activeGroundReport() {
  const r = appState.groundReport;
  if (!r) return null;
  if (Date.now() - r.at > GROUND_REPORT_TTL_MS) { appState.groundReport = null; return null; }
  return r;
}

function buildSeriesSet(nowSec) {
  if (appState.activeScenario !== 'live') return [seriesFromScenario(appState.currentScenarioData, nowSec)];
  const bundle = appState.forecastBundle;
  if (!bundle) return [];
  const now = Date.now();
  const list = [];
  const detFresh = bundle.det && bundle.det.length && now - bundle.detAt < DET_MAX_AGE_MS;
  if (detFresh) list.push(...bundle.det);
  else if (bundle.a0 && now - (bundle.a0At || 0) < DET_MAX_AGE_MS) list.push(bundle.a0);
  if (bundle.ens && bundle.ens.length && now - bundle.ensAt < ENS_MAX_AGE_MS) list.push(...bundle.ens);
  return list;
}

// Age (min) of the freshest deterministic forecast in use (live only).
function forecastDataAgeMin() {
  const b = appState.forecastBundle;
  if (appState.activeScenario !== 'live' || !b) return 0;
  const newest = Math.max(b.detAt || 0, b.a0At || 0);
  return newest ? (Date.now() - newest) / 60000 : 0;
}

function computeLeavePlanForState(gearOverride) {
  const gear = gearOverride || appState.gear;
  const nowSec = Date.now() / 1000;
  const tripMin = tripMinutes(appState.routeDistanceKm, appState.transportMode);
  const acceptTier = appState.dampOk ? ACCEPT_TIER_RELAXED : ACCEPT_TIER_STRICT;
  const windSpeed = (appState.currentScenarioData && appState.currentScenarioData.windSpeed) || 0;
  const tol = toleranceRateFor(appState.transportMode, gear, windSpeed, acceptTier);

  const obs = {};
  if (appState.activeScenario === 'live') {
    const report = activeGroundReport();
    const reportAge = report ? (Date.now() - report.at) / 60000 : 0;
    if (report && report.type === 'rain') { obs.rainTau = 25; obs.source = 'report'; obs.ageMin = reportAge; }
    else if (report && report.type === 'dry') { obs.dry = true; obs.ageMin = reportAge; }
    else if (appState.radar && appState.radar.status === 'echo' && appState.radar.frameTime) {
      obs.rainTau = 20; obs.source = 'radar'; obs.ageMin = Math.max(0, (nowSec - appState.radar.frameTime) / 60);
    }
  }
  return computeLeavePlan(buildSeriesSet(nowSec), { nowSec, tripMin, tol, obs, dataAgeMin: forecastDataAgeMin() });
}

function fmtClock(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtPct(p) {
  return `${Math.round(p * 100)}%`;
}

// ============================================================================
// 4.3 LEAVE PLAN -> UI HELPERS
// ============================================================================

function setSpans(el, texts) {
  if (!el) return;
  el.textContent = '';
  texts.forEach(t => {
    const span = document.createElement('span');
    span.textContent = t;
    el.appendChild(span);
  });
}

function tripVerb() {
  return appState.transportMode === 'car' ? 'drive' : appState.transportMode === 'scooter' ? 'ride' : 'walk';
}

function planTarget(plan) {
  return plan.recommended;
}

// Suggested departure offset (min): leave plan if available, else when rain stops.
function bestDepartureMins() {
  if (appState.leavePlan) return planTarget(appState.leavePlan).offsetMin;
  const d = appState.currentScenarioData;
  return d && d.stopMinutes ? d.stopMinutes : 0;
}

function clockIn(mins) {
  return fmtClock(new Date(Date.now() + mins * 60000));
}

function tierAtOffset(plan, offsetMin) {
  const c = planCandidateAt(plan, offsetMin);
  const data = appState.currentScenarioData;
  const rate = c ? c.expRate : 0;
  return computeWetness(rate, {
    mode: appState.transportMode, gear: appState.gear, windSpeed: data.windSpeed,
    puddleHigh: rate > 4
  }).tier;
}

// Median rain rate across models at an absolute time (for the along-route ribbon).
function medianRateAt(tSec) {
  const list = buildSeriesSet(Date.now() / 1000);
  const det = list.filter(s => s.group === 'det');
  const pool = det.length ? det : list;
  const vals = pool.map(s => rateAt(s, tSec)).filter(v => v !== null);
  return vals.length ? median(vals) : null;
}

// Would extra gear open a window? Shown only when there is no good window as-is.
function gearUpgradeHint(plan) {
  if (!plan || plan.earliestGood || appState.transportMode === 'car') return '';
  const g = appState.gear;
  if (g.raincoat && g.shoeCovers) return ' A cab is the only reliably dry option.';
  const alt = computeLeavePlanForState({ ...g, raincoat: true, umbrella: false, shoeCovers: true });
  if (alt && alt.earliestGood) {
    const when = alt.earliestGood.offsetMin === 0 ? 'now' : `at ~${clockIn(alt.earliestGood.offsetMin)}`;
    return ` With raincoat + boots you could leave ${when} (${fmtPct(alt.earliestGood.pOk)}).`;
  }
  return ' Even with raincoat + boots it stays wet — consider a cab.';
}

// Live "now" view from the same model set the leave plan uses, so the sky banner, the
// 60-min chart and the rain canvas can't contradict the plan. null = keep scenario data.
function liveNowView() {
  if (appState.activeScenario !== 'live' || activeGroundReport()) return null;
  const nowSec = Date.now() / 1000;
  const det = buildSeriesSet(nowSec).filter(s => s.group === 'det');
  if (appState.radar && appState.radar.status === 'echo') {
    return { title: "Rain on Radar at Your Location", icon: "🌧️", det, minIntensity: 'light' };
  }
  if (det.length < 2) return null;
  const nowRates = det.map(s => rateAt(s, nowSec + 60)).filter(v => v !== null);
  if (!nowRates.length) return null;
  const wet = nowRates.filter(v => v > 0).length;
  const med = median(nowRates);
  if (wet === 0) return { title: "No Rain Forecast Right Now", icon: "⛅", det };
  if (wet === nowRates.length) {
    return { title: med > 7.6 ? "Heavy Rain" : med > 2.5 ? "Moderate Rain" : "Light Rain / Drizzle", icon: med > 7.6 ? "⛈️" : "🌧️", det };
  }
  return { title: `Models Split: ${wet} of ${nowRates.length} Show Rain Now`, icon: "🌦️", det };
}

function renderLeaveCountdown(plan) {
  const caption = document.querySelector('.countdown-caption');
  const timerUnit = document.querySelector('.timer-unit');
  const timelineLabels = document.querySelector('.timeline-labels');
  const timelineBar = document.getElementById('timelineBar');
  const rec = plan.recommended;
  const nowP = plan.candidates[0].pOk;
  const trip = `${plan.tripMin}-min ${tripVerb()}`;
  const notes = plan.notes.length ? ` • ${plan.notes.join(', ')}` : '';
  const conf = `(${plan.confidence} confidence${notes})`;
  const clockEl = document.getElementById('stopClockTime');

  if (caption) caption.textContent = "WHEN CAN I LEAVE?";
  if (rec.offsetMin === 0) {
    document.getElementById('stopMinutes').textContent = "NOW";
    if (timerUnit) timerUnit.textContent = rec.kind === 'now' ? "GOOD TO GO" : rec.kind === 'now-fair' ? "FAIR CHANCE" : "NO BETTER LATER";
  } else {
    document.getElementById('stopMinutes').textContent = rec.offsetMin;
    if (timerUnit) timerUnit.textContent = rec.kind === 'wait' ? "MIN WAIT" : "MIN (BEST BET)";
  }

  if (rec.kind === 'now' || rec.kind === 'wait') {
    clockEl.textContent = `Leave ${rec.offsetMin === 0 ? 'now' : `~${clockIn(rec.offsetMin)}`} • ${fmtPct(rec.pOk)} chance your ${trip} stays dry enough ${conf}`;
  } else if (rec.kind === 'now-fair') {
    const later = plan.earliestGood
      ? ` Waiting until ${clockIn(plan.earliestGood.offsetMin)} only reaches ${fmtPct(plan.earliestGood.pOk)}.`
      : '';
    clockEl.textContent = `Leave now • ${fmtPct(nowP)} chance your ${trip} stays dry enough.${later} ${conf}`;
  } else if (rec.kind === 'best-bet') {
    clockEl.textContent = `No reliably dry window in next ${Math.round(plan.horizonMin / 60)} h — best bet ${clockIn(rec.offsetMin)} (${fmtPct(rec.pOk)}, now ${fmtPct(nowP)}) ${conf}`;
  } else {
    clockEl.textContent = `Rain likely for the next ${Math.round(plan.horizonMin / 60)} h — waiting won't help (${fmtPct(nowP)} now) ${conf}`;
  }

  if (timelineBar) {
    const n = plan.candidates.length;
    const stops = plan.candidates.map((c, i) => {
      const col = c.pOk >= GOOD_P ? '#10b981' : c.pOk >= FAIR_P ? '#f59e0b' : '#ef4444';
      return `${col} ${(i / Math.max(1, n - 1) * 100).toFixed(1)}%`;
    });
    timelineBar.style.width = "100%";
    timelineBar.style.background = n > 1 ? `linear-gradient(90deg, ${stops.join(', ')})` : stops[0].split(' ')[0];
    timelineBar.title = `Chance of a dry-enough trip by departure time (next ${Math.round(plan.horizonMin / 60)} h): green ≥80%, amber ≥60%, red below`;
  }
  if (timelineLabels) {
    const labels = plan.windows.length
      ? plan.windows.map(w => `✅ ${clockIn(w.startMin)}–${clockIn(w.endMin)}`)
      : [`Now ${fmtPct(nowP)}`, `Best ${clockIn(plan.best.offsetMin)} ${fmtPct(plan.best.pOk)}`, `+${Math.round(plan.horizonMin / 60)}h`];
    setSpans(timelineLabels, labels);
  }
}

function describeLeavePlan(plan) {
  const nowP = plan.candidates[0].pOk;
  const rec = plan.recommended;
  const trip = `${plan.tripMin}-min ${tripVerb()}`;
  const live = appState.activeScenario === 'live';
  const radarLine = live && appState.radar && appState.radar.status === 'echo'
    ? ' Radar shows rain at your location right now.'
    : live && appState.radar && appState.radar.nearby ? ' Rain cells within ~13 km on radar.' : '';

  if (rec.kind === 'now') {
    const w = plan.windows[0];
    const until = w && w.startMin === 0 && w.endMin < plan.horizonMin ? ` Good window lasts until ~${clockIn(w.endMin)}.` : '';
    return { headline: "Good time to leave now", desc: `${fmtPct(nowP)} chance your ${trip} stays dry enough.${until}${radarLine}` };
  }
  if (rec.kind === 'wait') {
    return {
      headline: `Wait ${rec.offsetMin} min — leave ~${clockIn(rec.offsetMin)}`,
      desc: `Leaving now: ${fmtPct(nowP)} chance of staying dry enough. At ${clockIn(rec.offsetMin)}: ${fmtPct(rec.pOk)}.${radarLine}`
    };
  }
  if (rec.kind === 'now-fair') {
    const later = plan.earliestGood ? ` Waiting until ${clockIn(plan.earliestGood.offsetMin)} only gets you to ${fmtPct(plan.earliestGood.pOk)}.` : '';
    return {
      headline: "Leave now — waiting barely helps",
      desc: `${fmtPct(nowP)} chance your ${trip} stays dry enough (some models show light rain).${later} Carry an umbrella just in case.${radarLine}`
    };
  }
  if (rec.kind === 'best-bet') {
    return {
      headline: `No reliably dry window — best bet ~${clockIn(rec.offsetMin)}`,
      desc: `Now ${fmtPct(nowP)}, at ${clockIn(rec.offsetMin)} ${fmtPct(rec.pOk)}.${gearUpgradeHint(plan)}${radarLine}`
    };
  }
  return {
    headline: "Rain likely for hours — waiting won't help",
    desc: `${fmtPct(nowP)} chance of staying dry enough now, and it doesn't improve later.${gearUpgradeHint(plan)}${radarLine}`
  };
}

// ============================================================================
// 4.5 NEXT-3-HOURS HORIZON RENDERER
// ============================================================================

// Next-3-hours strip (keeps its historical name/ids). With ensemble data it shows the
// chance of rain per hour across all ensemble runs; otherwise the single-model hourly value.
function renderWeatherNext3(data) {
  const strip = document.getElementById('weatherNext3Strip');
  if (!strip) return;

  const hourlyPrecip = (data && Array.isArray(data.hourlyPrecip)) ? data.hourlyPrecip : [0, 0, 0];
  const hourlyTemp = (data && Array.isArray(data.hourlyTemp)) ? data.hourlyTemp : [];
  const bundle = appState.forecastBundle;
  const ens = appState.activeScenario === 'live' && bundle && bundle.ens && bundle.ens.length ? bundle.ens : null;
  const badge = document.getElementById('wn3Badge');
  if (badge) badge.textContent = ens ? `${ens.length}-run ensemble` : (appState.activeScenario === 'live' ? 'Single model' : 'Simulation');

  const nowSec = Date.now() / 1000;
  strip.textContent = '';

  for (let i = 0; i < 3; i++) {
    const hourStr = `${fmtClock(new Date((nowSec + i * 3600) * 1000))}–${fmtClock(new Date((nowSec + (i + 1) * 3600) * 1000))}`;
    let chance = null;
    let precip = hourlyPrecip[i] !== undefined ? hourlyPrecip[i] : 0;
    if (ens) {
      // value for the hour (t-1h, t] containing now + i h + 30 min
      const tMid = nowSec + i * 3600 + 1800;
      const bySys = {};
      const vals = [];
      ens.forEach(s => {
        const v = rateAt(s, tMid);
        if (v === null) return;
        (bySys[s.system] = bySys[s.system] || []).push(v >= 0.1);
        vals.push(v);
      });
      const systems = Object.values(bySys);
      if (systems.length) {
        chance = systems.reduce((acc, arr) => acc + arr.filter(Boolean).length / arr.length, 0) / systems.length;
        precip = median(vals);
      }
    }

    const wet = chance !== null ? chance >= 0.5 : precip > 0.1;
    let icon = "☀️";
    if (chance !== null) icon = chance >= 0.7 ? "🌧️" : chance >= 0.4 ? "🌦️" : chance >= 0.15 ? "⛅" : "☀️";
    else icon = precip > 5 ? "🌧️" : precip > 0.1 ? "🌦️" : "☀️";

    const card = document.createElement('div');
    card.className = 'horizon-card';
    const parts = [
      ['hz-time', hourStr],
      ['hz-icon', icon],
      ['hz-temp', hourlyTemp[i] !== undefined ? `${Math.round(hourlyTemp[i])}°C` : ''],
      [`hz-precip ${wet ? 'wet' : 'dry'}`, chance !== null ? `${fmtPct(chance)} rain chance` : (precip > 0.1 ? `${precip.toFixed(1)} mm/h` : '0 mm/h (Dry)')],
      ['hz-tier', chance !== null ? `median ${precip.toFixed(1)} mm/h` : (precip > 4 ? 'Heavy' : precip > 1 ? 'Rain' : precip > 0.1 ? 'Drizzle' : 'Dry')]
    ];
    parts.forEach(([cls, text]) => {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = text;
      card.appendChild(span);
    });
    strip.appendChild(card);
  }
}

// ============================================================================
// 5. CORE UI UPDATE DISPATCHER
// ============================================================================

// Short stop-time label. When no dry break exists in the forecast window, stopMinutes is
// the window length, so show "N+ h" rather than a fake countdown.
function formatStopShort(data) {
  if (!data.stopBeyondHorizon) return `${data.stopMinutes}m`;
  return data.stopMinutes >= 60 ? `${Math.floor(data.stopMinutes / 60)}+ h` : `${data.stopMinutes}+ m`;
}

function updateUI() {
  const data = appState.currentScenarioData;
  appState.leavePlan = computeLeavePlanForState();
  const plan = appState.leavePlan;
  const result = calculateWetnessAndConsequences();

  // 1. Sky Banner & Countdown
  const nowView = liveNowView();
  // 60-min profile (5-min buckets): median across models when several are loaded
  let profile = data.rainProfile;
  if (nowView && nowView.det.length >= 2) {
    const t0 = Date.now() / 1000;
    profile = Array.from({ length: 12 }, (_, i) => {
      const vals = nowView.det.map(s => rateAt(s, t0 + i * 300 + 150)).filter(v => v !== null);
      return vals.length ? +median(vals).toFixed(1) : 0;
    });
  }
  document.getElementById('skyTitle').textContent = nowView ? nowView.title : data.skyTitle;
  document.getElementById('skySubtitle').textContent = data.skySubtitle;
  document.getElementById('skyIcon').textContent = nowView ? nowView.icon : data.skyIcon;
  document.getElementById('puddleRisk').textContent = data.puddleRisk;
  document.getElementById('windSpeed').textContent = `${data.windSpeed} km/h`;

  const countdownCaption = document.querySelector('.countdown-caption');
  const timerUnit = document.querySelector('.timer-unit');
  const timelineLabels = document.querySelector('.timeline-labels');
  const timelineBar = document.getElementById('timelineBar');
  const now = new Date();

  if (plan) {
    renderLeaveCountdown(plan);
  } else if (data.stopMinutes === 0) {
    if (countdownCaption) countdownCaption.textContent = "PRECIPITATION STATUS";
    document.getElementById('stopMinutes').textContent = "0";
    if (timerUnit) timerUnit.textContent = "MINS • DRY";
    document.getElementById('stopClockTime').textContent = "🟢 Sky is dry right now • Safe to step out";
    if (timelineBar) {
      timelineBar.style.width = "100%";
      timelineBar.style.background = "linear-gradient(90deg, #10b981, #059669)";
    }
    if (timelineLabels) {
      timelineLabels.innerHTML = `
        <span>Now (Dry)</span>
        <span>30m (Clear)</span>
        <span>60m (Clear)</span>
      `;
    }
  } else {
    if (countdownCaption) countdownCaption.textContent = "WHEN WILL IT STOP?";
    const showHours = data.stopBeyondHorizon && data.stopMinutes >= 60;
    document.getElementById('stopMinutes').textContent = showHours
      ? `${Math.floor(data.stopMinutes / 60)}+`
      : data.stopBeyondHorizon ? `${data.stopMinutes}+` : data.stopMinutes;
    if (timerUnit) timerUnit.textContent = showHours ? "HOURS" : "MINUTES";
    const stopDate = new Date(now.getTime() + data.stopMinutes * 60000);
    const timeString = stopDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('stopClockTime').textContent = data.stopBeyondHorizon
      ? `No dry break in forecast window (${formatStopShort(data)})`
      : `Safe to step out at ~${timeString}`;
    const timelinePct = Math.max(15, Math.min(100, 100 - (data.stopMinutes * 2.5)));
    if (timelineBar) {
      timelineBar.style.width = `${timelinePct}%`;
      timelineBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)";
    }
    if (timelineLabels) {
      const halfMins = Math.round(data.stopMinutes / 2);
      timelineLabels.innerHTML = data.stopBeyondHorizon ? `
        <span>Now (Rain)</span>
        <span>No break</span>
        <span>${formatStopShort(data)} (Still Rain)</span>
      ` : `
        <span>Now (Rain)</span>
        <span>${halfMins}m (Easing)</span>
        <span>${data.stopMinutes}m (Dry Sky)</span>
      `;
    }
  }

  // 2. 60-Minute Chart Bars
  const chartEl = document.getElementById('minutelyChart');
  chartEl.innerHTML = '';
  profile.forEach((val, idx) => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    const height = Math.min(48, Math.max(4, val * 3.5));
    col.style.height = `${height}px`;

    if (val > 8) col.classList.add('heavy');
    else if (val > 3) col.classList.add('moderate');
    else if (val > 0) col.classList.add('light');
    else col.classList.add('dry');

    col.title = `+${idx * 5}m: ${val} mm/h${nowView && nowView.det.length >= 2 ? ' (median of models)' : ''}`;
    chartEl.appendChild(col);
  });

  // 2.5 Next-3-hours strip (ensemble rain chance)
  renderWeatherNext3(data);

  // 3. Advice Card (leave plan when available, scenario text otherwise)
  const advice = plan ? describeLeavePlan(plan) : { headline: data.adviceHeadline, desc: data.adviceDesc };
  document.getElementById('adviceHeadline').textContent = advice.headline;
  document.getElementById('adviceDesc').textContent = advice.desc;
  const adviceBadge = document.getElementById('adviceBadge');
  if (adviceBadge && plan) adviceBadge.textContent = `🧭 ${plan.confidence.toUpperCase()} CONFIDENCE`;

  // Data-source status chip
  const engLabelEl = document.getElementById('engineLabel');
  if (engLabelEl && plan && appState.activeScenario === 'live') {
    const radarTxt = !appState.radar ? 'radar …' : appState.radar.status === 'echo' ? 'radar: rain here'
      : appState.radar.status === 'none' ? 'radar ✓' : 'radar –';
    const modelsTxt = plan.sources.det > 1 ? `${plan.sources.det} models` : '1 model';
    const ensTxt = plan.sources.ens ? ` • ${plan.sources.ens}-run ensemble` : '';
    engLabelEl.textContent = `${modelsTxt}${ensTxt} • ${radarTxt}`;
  }

  // 4. Consequence Tier Banner with Dynamic Ambient Glow
  const tierBadge = document.getElementById('tierBadge');
  const consequenceBanner = document.getElementById('consequenceBanner');
  tierBadge.textContent = `TIER ${result.tier}`;
  tierBadge.style.background = result.badgeColor;
  tierBadge.style.boxShadow = `0 0 16px ${result.badgeColor}`;
  document.getElementById('tierHeadline').textContent = result.tierHeadline;
  document.getElementById('tierSubtext').textContent = result.tierSubtext;

  if (consequenceBanner) {
    consequenceBanner.style.borderColor = result.badgeColor;
    consequenceBanner.style.background = `linear-gradient(135deg, ${result.badgeColor}20, rgba(15, 23, 42, 0.88))`;
    consequenceBanner.style.boxShadow = `0 8px 28px ${result.badgeColor}25`;
  }

  // Avatar Tooltip initial status
  const avatarTooltip = document.getElementById('avatarTooltip');
  if (avatarTooltip) {
    avatarTooltip.innerHTML = `💡 <strong>Tier ${result.tier} (${result.tierHeadline})</strong> • Hover body zones for details`;
    avatarTooltip.style.borderColor = result.badgeColor;
  }

  // 5. Avatar SVG Zones
  const zoneParts = {
    head: document.querySelectorAll('#zoneHead .body-part'),
    torso: document.querySelectorAll('#zoneTorso .body-part'),
    backpack: document.querySelectorAll('#zoneBackpack .body-part'),
    legs: document.querySelectorAll('#zoneLegs .body-part'),
    shoes: document.querySelectorAll('#zoneShoes .body-part')
  };

  Object.keys(zoneParts).forEach(zone => {
    const status = result.bodyStatus[zone];
    zoneParts[zone].forEach(part => {
      part.classList.remove('dry', 'damp', 'soaked');
      part.classList.add(status);
    });
  });

  const statusLabels = {
    dry: '🟢 Dry & Crisp',
    damp: '🟡 Damp (Minor)',
    soaked: '🔴 Soaked Wet!'
  };
  document.querySelector('#labelHead .val').textContent = statusLabels[result.bodyStatus.head];
  document.querySelector('#labelTorso .val').textContent = statusLabels[result.bodyStatus.torso];
  document.querySelector('#labelBackpack .val').textContent = statusLabels[result.bodyStatus.backpack];
  document.querySelector('#labelLegs .val').textContent = statusLabels[result.bodyStatus.legs];
  document.querySelector('#labelShoes .val').textContent = statusLabels[result.bodyStatus.shoes];

  // 6. Gear & Vehicle Layer visibility on SVG (Cleanly toggle visible/hidden)
  const umbrellaLayer = document.getElementById('umbrellaLayer');
  const raincoatLayer = document.getElementById('raincoatLayer');
  const carCabinLayer = document.getElementById('carCabinLayer');
  const scooterHelmetLayer = document.getElementById('scooterHelmetLayer');

  function setLayerVisible(el, isVisible) {
    if (!el) return;
    if (isVisible) {
      el.classList.remove('hidden');
      el.classList.add('visible');
      el.style.display = 'block';
      el.style.opacity = '1';
    } else {
      el.classList.remove('visible');
      el.classList.add('hidden');
      el.style.display = 'none';
      el.style.opacity = '0';
    }
  }

  const isCar = appState.transportMode === 'car';
  const isScooter = appState.transportMode === 'scooter';
  const isWalk = appState.transportMode === 'walk';

  // Synchronize Mode Buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    const mode = (btn.dataset && btn.dataset.mode) || btn.getAttribute('data-mode');
    btn.classList.toggle('active', mode === appState.transportMode);
  });

  // Synchronize Gear Checkbox Cards & Inputs with appState.gear
  const cardUmbrella = document.getElementById('cardUmbrella');
  const cardRaincoat = document.getElementById('cardRaincoat');
  const cardShoeCovers = document.getElementById('cardShoeCovers');
  const cardBagCover = document.getElementById('cardBagCover');
  const gearUmbrella = document.getElementById('gearUmbrella');
  const gearRaincoat = document.getElementById('gearRaincoat');
  const gearShoeCovers = document.getElementById('gearShoeCovers');
  const gearBagCover = document.getElementById('gearBagCover');

  if (isCar) {
    if (gearUmbrella) { gearUmbrella.checked = false; gearUmbrella.disabled = true; }
    if (gearRaincoat) { gearRaincoat.checked = false; gearRaincoat.disabled = true; }
    if (cardUmbrella) { cardUmbrella.classList.add('disabled'); cardUmbrella.classList.remove('active'); cardUmbrella.title = "Not needed — Car cabin provides 100% overhead cover"; }
    if (cardRaincoat) { cardRaincoat.classList.add('disabled'); cardRaincoat.classList.remove('active'); cardRaincoat.title = "Not needed — Car cabin provides 100% overhead cover"; }
    appState.gear.umbrella = false;
    appState.gear.raincoat = false;
  } else if (isScooter) {
    if (gearUmbrella) { gearUmbrella.checked = false; gearUmbrella.disabled = true; }
    if (gearRaincoat) { gearRaincoat.disabled = false; gearRaincoat.checked = appState.gear.raincoat; }
    if (cardUmbrella) { cardUmbrella.classList.add('disabled'); cardUmbrella.classList.remove('active'); cardUmbrella.title = "Cannot hold umbrella while operating 2-wheeler — use a raincoat"; }
    if (cardRaincoat) { cardRaincoat.classList.remove('disabled'); cardRaincoat.classList.toggle('active', appState.gear.raincoat); cardRaincoat.title = ""; }
    appState.gear.umbrella = false;
  } else {
    if (gearUmbrella) { gearUmbrella.disabled = false; gearUmbrella.checked = appState.gear.umbrella; }
    if (gearRaincoat) { gearRaincoat.disabled = false; gearRaincoat.checked = appState.gear.raincoat; }
    if (cardUmbrella) { cardUmbrella.classList.remove('disabled'); cardUmbrella.classList.toggle('active', appState.gear.umbrella); cardUmbrella.title = ""; }
    if (cardRaincoat) { cardRaincoat.classList.remove('disabled'); cardRaincoat.classList.toggle('active', appState.gear.raincoat); cardRaincoat.title = ""; }
  }

  if (gearShoeCovers) gearShoeCovers.checked = appState.gear.shoeCovers;
  if (cardShoeCovers) cardShoeCovers.classList.toggle('active', appState.gear.shoeCovers);
  if (gearBagCover) gearBagCover.checked = appState.gear.bagCover;
  if (cardBagCover) cardBagCover.classList.toggle('active', appState.gear.bagCover);

  const bootsLayer = document.getElementById('bootsLayer');
  const bagCoverLayer = document.getElementById('bagCoverLayer');

  setLayerVisible(carCabinLayer, isCar);
  setLayerVisible(scooterHelmetLayer, isScooter);
  setLayerVisible(umbrellaLayer, isWalk && appState.gear.umbrella && !appState.gear.raincoat);
  setLayerVisible(raincoatLayer, (isWalk || isScooter) && appState.gear.raincoat);
  setLayerVisible(bootsLayer, !isCar && appState.gear.shoeCovers);
  setLayerVisible(bagCoverLayer, !isCar && appState.gear.bagCover);

  if (isCar) {
    document.getElementById('gearStatusChip').textContent = '🚗 Enclosed Car Cabin';
  } else if (isScooter) {
    document.getElementById('gearStatusChip').textContent = '🛵 2-Wheeler / Rider';
  } else {
    let gearText = '🛡️ No Gear';
    if (appState.gear.raincoat) gearText = '🧥 Raincoat Active';
    else if (appState.gear.umbrella) gearText = '🌂 Umbrella Active';
    document.getElementById('gearStatusChip').textContent = gearText;
  }

  // 7. Outfit Safety Checklist
  const checkSneakers = document.getElementById('checkSneakers');
  const checkLaptop = document.getElementById('checkLaptop');
  const checkJacket = document.getElementById('checkJacket');

  if (appState.transportMode === 'car') {
    checkSneakers.className = 'check-item safe';
    checkSneakers.querySelector('.check-text').innerHTML = 'Footwear: <strong>Protected in Car</strong>';
    checkLaptop.className = 'check-item safe';
    checkLaptop.querySelector('.check-text').innerHTML = 'Laptop: <strong>Cabin Shielded</strong>';
    checkJacket.className = 'check-item safe';
    checkJacket.querySelector('.check-text').innerHTML = 'Clothes: <strong>100% Dry</strong>';
  } else {
    if (result.bodyStatus.shoes === 'soaked') {
      checkSneakers.className = 'check-item danger';
      checkSneakers.querySelector('.check-text').innerHTML = 'White Sneakers: <strong>Ruined</strong>';
    } else if (result.bodyStatus.shoes === 'damp') {
      checkSneakers.className = 'check-item warning';
      checkSneakers.querySelector('.check-text').innerHTML = 'White Sneakers: <strong>Slight Splashes</strong>';
    } else {
      checkSneakers.className = 'check-item safe';
      checkSneakers.querySelector('.check-text').innerHTML = 'White Sneakers: <strong>100% Safe</strong>';
    }

    if (result.bodyStatus.backpack === 'soaked') {
      checkLaptop.className = 'check-item danger';
      checkLaptop.querySelector('.check-text').innerHTML = 'Laptop in Bag: <strong>High Risk</strong>';
    } else if (result.bodyStatus.backpack === 'damp') {
      checkLaptop.className = 'check-item warning';
      checkLaptop.querySelector('.check-text').innerHTML = 'Laptop in Bag: <strong>Use Cover</strong>';
    } else {
      checkLaptop.className = 'check-item safe';
      checkLaptop.querySelector('.check-text').innerHTML = 'Laptop in Bag: <strong>Protected</strong>';
    }

    if (result.bodyStatus.torso === 'soaked') {
      checkJacket.className = 'check-item danger';
      checkJacket.querySelector('.check-text').innerHTML = 'Jacket: <strong>Waterlogged</strong>';
    } else {
      checkJacket.className = 'check-item safe';
      checkJacket.querySelector('.check-text').innerHTML = 'Jacket: <strong>Dry</strong>';
    }
  }

  // 8. Route Duration & Distance tag
  document.getElementById('routeDurationTag').textContent = 
    `${appState.transportMode === 'walk' ? '🚶' : appState.transportMode === 'scooter' ? '🛵' : '🚗'} ${result.tripDurationMins} mins (${appState.routeDistanceKm} km)`;

  const scrubText = document.getElementById('scrubDepartureText');
  if (scrubText) {
    const depTime = new Date(now.getTime() + appState.departureDelayMins * 60000);
    const arrTime = new Date(depTime.getTime() + result.tripDurationMins * 60000);
    const depStr = depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const arrStr = arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const cand = planCandidateAt(plan, appState.departureDelayMins);
    const pctTxt = cand ? ` • ${fmtPct(cand.pOk)} dry enough` : '';
    const delayTxt = appState.departureDelayMins >= 60
      ? `+${Math.floor(appState.departureDelayMins / 60)}h${appState.departureDelayMins % 60 ? ` ${appState.departureDelayMins % 60}m` : ''}`
      : `+${appState.departureDelayMins}m`;
    if (appState.departureDelayMins === 0) {
      scrubText.innerHTML = `Leave <strong>NOW</strong> (~${depStr}) ➔ Arrive ~${arrStr} (Tier ${result.tier}${pctTxt})`;
    } else {
      scrubText.innerHTML = `Leave in <strong>${delayTxt}</strong> (~${depStr}) ➔ Arrive ~${arrStr} (Tier ${result.tier}${pctTxt})`;
    }
  }

  // 9. Route Weather Ribbon (Along-Path Radar)
  renderRouteRibbon();

  // 10. Comparison Cards
  const isCurrentlyDry = data.stopMinutes === 0;
  const nowTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (plan) {
    const target = planTarget(plan);
    const nowCand = plan.candidates[0];
    document.getElementById('compWaitTitle').textContent = target.offsetMin === 0
      ? (target.kind === 'now' ? `Leave now — good window open` : `Leave now — waiting won't help much`)
      : target.kind === 'wait'
        ? `Best: leave ${clockIn(target.offsetMin)} (in ${target.offsetMin} min)`
        : `Best bet: ${clockIn(target.offsetMin)} (no reliably dry window)`;
    const waitSub = document.getElementById('compWaitSub');
    if (waitSub) waitSub.textContent = `${fmtPct(target.pOk)} chance dry enough • Tier ${tierAtOffset(plan, target.offsetMin)} expected`;
    document.getElementById('compNowTitle').textContent = `Leave Now (${nowTimeString})`;
    document.getElementById('compNowSub').textContent = `${fmtPct(nowCand.pOk)} chance dry enough • Tier ${tierAtOffset(plan, 0)} if it rains as forecast`;
  } else if (isCurrentlyDry) {
    document.getElementById('compWaitTitle').textContent = `Zero Wait Needed (Sky Clear)`;
    document.getElementById('compNowTitle').textContent = `Leave Now (${nowTimeString})`;
    document.getElementById('compNowSub').textContent = `Tier 0: Bone Dry & Crisp`;
  } else {
    const waitDepartureTime = new Date(now.getTime() + data.stopMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('compWaitTitle').textContent = data.stopBeyondHorizon
      ? `No dry break for ${formatStopShort(data)} (waiting won't help)`
      : `Wait ${data.stopMinutes} mins (Leave ~${waitDepartureTime})`;
    document.getElementById('compNowTitle').textContent = `Leave Now (${nowTimeString})`;
    document.getElementById('compNowSub').textContent = `Tier ${result.tier}: ${result.tierHeadline}`;
  }

  // Update rain canvas
  if (window.rainEngineInstance) {
    let intensity = data.rainIntensity;
    if (nowView) {
      const r = profile[0] || 0;
      intensity = r > 7.6 ? 'heavy' : r > 2.5 ? 'moderate' : r > 0 ? 'light' : (nowView.minIntensity || 'dry_now');
    }
    window.rainEngineInstance.setIntensity(intensity, data.windSpeed);
    if (data.lightning && Math.random() > 0.6) {
      window.rainEngineInstance.triggerLightning();
    }
  }

  // Trigger chime and notification when it becomes a good time to leave
  // (or, without a leave plan, when the rain stops).
  const goodToGo = plan ? plan.leaveNowOk : data.stopMinutes === 0;
  if (appState.isRainStopAlertActive && goodToGo) {
    playRainStopChime();
    showToast("🎉 <strong>Good time to leave!</strong> Your trip should stay dry enough now.", 5000);
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = "RainStop • Good time to leave 🌤️";
      const opts = {
        body: plan
          ? `${fmtPct(plan.candidates[0].pOk)} chance your ${plan.tripMin}-min ${tripVerb()} from ${(appState.origin || DEFAULT_COORDS.name).split(',')[0]} stays dry enough.`
          : `Overhead precipitation has stopped at ${(appState.origin || DEFAULT_COORDS.name).split(',')[0]}. Perfect time for your commute!`,
        icon: "icon.svg"
      };
      // Android Chrome forbids `new Notification()`; use the service worker there.
      const viaSw = () => navigator.serviceWorker.ready.then(reg => reg.showNotification(title, opts)).catch(() => {});
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) viaSw();
        else new Notification(title, opts);
      } catch (e) {
        if ('serviceWorker' in navigator) viaSw();
      }
    }
    appState.isRainStopAlertActive = false;
    const btnAlert = document.getElementById('btnAlertRainStop');
    const alertBtnText = document.getElementById('alertBtnText');
    if (btnAlert) btnAlert.classList.remove('active');
    if (alertBtnText) alertBtnText.textContent = "Alert When Dry";
  }

  // 11. Synchronize Mobile Quick Summary Strip
  const stripTimer = document.getElementById('stripTimerText');
  const stripTier = document.getElementById('stripTierText');
  const stripModeIcon = document.getElementById('stripModeIcon');
  const stripModeText = document.getElementById('stripModeText');

  if (stripTimer && plan) {
    stripTimer.textContent = planTarget(plan).offsetMin === 0
      ? `Go now (${fmtPct(plan.candidates[0].pOk)})`
      : `Leave ${clockIn(planTarget(plan).offsetMin)} (${fmtPct(planTarget(plan).pOk)})`;
  } else if (stripTimer) {
    if (data.stopMinutes > 0) {
      stripTimer.textContent = data.stopBeyondHorizon ? `No break ${formatStopShort(data)}` : `${data.stopMinutes}m to dry`;
    } else {
      stripTimer.textContent = `Sky is dry`;
    }
  }

  if (stripTier && result) {
    stripTier.textContent = `Tier ${result.tier} ${result.tier === 0 ? 'Bone Dry' : 'Damp'}`;
  }

  if (stripModeIcon && stripModeText) {
    if (appState.transportMode === 'car') {
      stripModeIcon.textContent = '🚗';
      stripModeText.textContent = 'Car Mode';
    } else if (appState.transportMode === 'scooter') {
      stripModeIcon.textContent = '🛵';
      stripModeText.textContent = '2-Wheeler';
    } else {
      stripModeIcon.textContent = '🚶';
      stripModeText.textContent = 'Walk Mode';
    }
  }

  // 12. Synchronize 1-Page Mobile Action Dock
  const mobileWaitMins = document.getElementById('mobileWaitMins');
  if (mobileWaitMins) {
    if (plan) mobileWaitMins.textContent = planTarget(plan).offsetMin === 0 ? 'Now' : clockIn(planTarget(plan).offsetMin);
    else mobileWaitMins.textContent = data.stopMinutes > 0 ? formatStopShort(data) : 'Now';
  }

  // 13. Conditions card (+ phone top bar) and the map-first sheet's peek summary
  renderMetrics();
  renderMobileSummary(plan, nowView);
  // 14. Active-cyclone banner (GDACS events only, never model lows)
  renderCycloneAlert();
}

// ============================================================================
// 6. ROUTE WEATHER RIBBON RENDERER
// ============================================================================

function renderRouteRibbon() {
  const data = appState.currentScenarioData;
  const trackEl = document.getElementById('ribbonTrack');
  const warningEl = document.getElementById('ribbonWarningBox');
  const summaryEl = document.getElementById('routeSummaryBadge');
  const ribbonTitle = document.querySelector('.ribbon-title');

  if (!trackEl) return;

  const originShort = (appState.origin || "Origin").split(',')[0].trim();
  const destShort = (appState.dest || "Destination").split(',')[0].trim();
  const distKm = typeof appState.routeDistanceKm === 'number' ? appState.routeDistanceKm : 1.5;

  if (ribbonTitle) {
    ribbonTitle.textContent = `🗺️ RAIN PROFILE ALONG ROUTE (${distKm} km)`;
  }

  // Forecast rain (median across models) at the moment you pass each checkpoint, for the
  // departure chosen on the slider. Weather is fetched for the origin point only.
  const tripMin = tripMinutes(distKm, appState.transportMode);
  const departSec = Date.now() / 1000 + appState.departureDelayMins * 60;
  const rateWhenPassing = (frac) => {
    const r = medianRateAt(departSec + frac * tripMin * 60);
    if (r !== null) return +r.toFixed(1);
    const idx = Math.min(11, Math.floor((appState.departureDelayMins + frac * tripMin) / 5));
    return (data.rainProfile && data.rainProfile[idx]) || 0;
  };
  const classify = (r) => r > 4 ? "heavy" : r > 1.5 ? "moderate" : r > 0.2 ? "light" : "dry";
  const currentPrecip = rateWhenPassing(0);
  const originRain = classify(currentPrecip);
  const midRainRate = rateWhenPassing(0.5);
  const midRain = classify(midRainRate);
  const destRainRate = rateWhenPassing(1);
  const destRain = classify(destRainRate);

  const checkpoints = [
    {
      name: originShort,
      dist: "0.0 km",
      rain: originRain,
      rate: currentPrecip,
      text: `${currentPrecip.toFixed(1)} mm/h`
    },
    {
      name: "Midpoint",
      dist: `${(distKm * 0.5).toFixed(1)} km`,
      rain: midRain,
      rate: midRainRate,
      text: `${midRainRate.toFixed(1)} mm/h`
    },
    {
      name: destShort,
      dist: `${distKm} km`,
      rain: destRain,
      rate: destRainRate,
      text: `${destRainRate.toFixed(1)} mm/h`
    }
  ];

  trackEl.innerHTML = '';
  checkpoints.forEach((cp, idx) => {
    const node = document.createElement('div');
    node.className = 'checkpoint-node';
    
    let weatherIcon = "🌤️";
    if (cp.rain === 'heavy') weatherIcon = "⛈️";
    else if (cp.rain === 'moderate') weatherIcon = "🌧️";
    else if (cp.rain === 'light') weatherIcon = "🌦️";

    const markerLabel = idx === 0 ? "🟢 A" : idx === checkpoints.length - 1 ? "🏁 B" : "📍";

    // Built with textContent: place names come from URLs/geocoders and must not be parsed as HTML.
    const badge = document.createElement('span');
    badge.className = 'cp-badge';
    badge.title = idx === 0 ? 'Origin' : idx === checkpoints.length - 1 ? 'Destination' : 'Waypoint';
    badge.textContent = `${markerLabel} ${weatherIcon}`;
    const nameEl = document.createElement('span');
    nameEl.className = 'cp-name';
    nameEl.title = cp.name;
    nameEl.textContent = cp.name;
    const rainEl = document.createElement('span');
    rainEl.className = `cp-rain ${cp.rain}`;
    rainEl.textContent = cp.text;
    [badge, nameEl, rainEl].forEach(child => node.appendChild(child));
    trackEl.appendChild(node);
  });

  const isAnyRain = checkpoints.some(c => c.rain !== 'dry');

  if (warningEl) {
    if (isAnyRain) {
      warningEl.textContent = `⚠️ Forecast: rain while you travel ${originShort} ➔ ${destShort} (up to ${Math.max(currentPrecip, midRainRate, destRainRate).toFixed(1)} mm/h, when you pass).`;
    } else {
      warningEl.textContent = `🟢 No rain forecast while you travel ${originShort} ➔ ${destShort}.`;
    }
  }

  if (summaryEl) {
    const hasHeavy = checkpoints.some(c => c.rain === 'heavy');
    const hasModerate = checkpoints.some(c => c.rain === 'moderate');
    const hasLight = checkpoints.some(c => c.rain === 'light');

    if (hasHeavy) {
      summaryEl.textContent = "⚠️ Heavy Storm Pocket";
      summaryEl.style.color = "#ef4444";
    } else if (hasModerate) {
      summaryEl.textContent = "🌧️ Active Rain on Path";
      summaryEl.style.color = "#f59e0b";
    } else if (hasLight) {
      summaryEl.textContent = "🌦️ Light Drizzle on Path";
      summaryEl.style.color = "#38bdf8";
    } else {
      summaryEl.textContent = "🟢 Clear Route Flow";
      summaryEl.style.color = "#10b981";
    }
  }
}

// ============================================================================
// 7. PHOTON LIVE GLOBAL AUTOCOMPLETE ENGINE (Free • No API Key Needed)
// ============================================================================

let searchDebounceTimer = null;

function getPhotonIcon(props) {
  const osmKey = props.osm_key || '';
  const osmVal = props.osm_value || '';
  const type = props.type || '';
  if (osmKey === 'amenity') {
    if (osmVal === 'university' || osmVal === 'school' || osmVal === 'college') return '🎓';
    if (osmVal === 'library') return '📚';
    if (osmVal === 'restaurant' || osmVal === 'cafe' || osmVal === 'fast_food') return '☕';
    if (osmVal === 'hospital' || osmVal === 'pharmacy') return '🏥';
    if (osmVal === 'bank' || osmVal === 'atm') return '🏦';
  }
  if (osmKey === 'highway' || type === 'street') return '🛣️';
  if (osmKey === 'railway' || osmVal === 'station') return '🚉';
  if (osmKey === 'shop' || osmVal === 'mall') return '🛍️';
  if (osmKey === 'tourism' || osmVal === 'hotel') return '🏨';
  if (osmKey === 'leisure' || osmVal === 'park') return '🌳';
  return '📍';
}

// The user picked a new trip (autocomplete, swap, route chip): leave the all-India view.
// Desktop refits the route; phones keep the radar view (route fit only via the Route button).
function focusNewTrip() {
  if (!isMobileMap()) appState.mapFocus = 'route';
  else if (appState.mapFocus === 'india') appState.mapFocus = 'radar';
}

function setupPhotonAutocomplete(inputId, dropdownId, clearBtnId, stateKey) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const clearBtn = document.getElementById(clearBtnId);

  if (!input || !dropdown) return;

  async function renderSuggestions(query) {
    const q = query.trim().toLowerCase();
    dropdown.innerHTML = '';

    // If query is empty, show instant campus landmarks
    if (!q) {
      const localMatches = PLACES_DATABASE.slice(0, 6);
      localMatches.forEach(item => {
        const row = createDropdownRow(item.icon, item.name, item.city, item.lat, item.lon);
        dropdown.appendChild(row);
      });
      dropdown.classList.add('open');
      return;
    }

    // Instant local matches for fast response (0ms)
    const localMatches = PLACES_DATABASE.filter(p => 
      p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
    ).slice(0, 3);

    localMatches.forEach(item => {
      const row = createDropdownRow(item.icon, item.name, item.city, item.lat, item.lon);
      dropdown.appendChild(row);
    });

    // Query Photon API (Komoot OpenStreetMap search) with local bias
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
      try {
        const lat = appState.originCoords ? appState.originCoords.lat : DEFAULT_COORDS.lat;
        const lon = appState.originCoords ? appState.originCoords.lon : DEFAULT_COORDS.lon;
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}&limit=6`;
        
        const res = await fetch(url);
        const json = await res.json();

        if (json && json.features && json.features.length > 0) {
          dropdown.innerHTML = '';
          
          json.features.forEach(feat => {
            const props = feat.properties;
            const coords = feat.geometry.coordinates; // [lon, lat]
            const name = props.name || props.street || query;
            const sub = [props.street, props.city || props.county, props.state].filter(Boolean).join(', ') || props.country || 'Location';
            const icon = getPhotonIcon(props);

            const row = createDropdownRow(icon, name, sub, coords[1], coords[0]);
            dropdown.appendChild(row);
          });
          dropdown.classList.add('open');
        }
      } catch (e) {
        // Photon fallback to Nominatim
        try {
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4`);
          const results = await res2.json();
          results.forEach(resItem => {
            const parts = resItem.display_name.split(',');
            const title = parts[0];
            const sub = parts.slice(1, 3).join(',').trim();
            const row = createDropdownRow("📍", title, sub, parseFloat(resItem.lat), parseFloat(resItem.lon));
            dropdown.appendChild(row);
          });
        } catch (err) {}
      }
    }, 150);

    dropdown.classList.add('open');
  }

  function createDropdownRow(icon, title, sub, lat, lon) {
    const row = document.createElement('div');
    row.className = 'autocomplete-item';
    // textContent only: titles/subtitles come from external geocoders.
    const iconEl = document.createElement('span');
    iconEl.className = 'auto-icon';
    iconEl.textContent = icon;
    const textWrap = document.createElement('div');
    textWrap.className = 'auto-text';
    const titleEl = document.createElement('div');
    titleEl.className = 'auto-title';
    titleEl.textContent = title;
    const subEl = document.createElement('div');
    subEl.className = 'auto-subtitle';
    subEl.textContent = sub;
    textWrap.appendChild(titleEl);
    textWrap.appendChild(subEl);
    row.appendChild(iconEl);
    row.appendChild(textWrap);
    row.addEventListener('click', () => {
      input.value = title;
      appState[stateKey] = title;
      if (stateKey === 'origin') {
        appState.originCoords = { lat, lon };
        if (originMarker) originMarker.setLatLng([lat, lon]);
      } else {
        appState.destCoords = { lat, lon };
        if (destMarker) destMarker.setLatLng([lat, lon]);
      }
      dropdown.classList.remove('open');
      document.querySelectorAll('.route-chip').forEach(c => c.classList.remove('active'));
      focusNewTrip();
      fetchAndDrawRoute();
    });
    return row;
  }

  input.addEventListener('focus', () => renderSuggestions(input.value));
  input.addEventListener('input', (e) => {
    document.querySelectorAll('.route-chip').forEach(c => c.classList.remove('active'));
    renderSuggestions(e.target.value);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      document.querySelectorAll('.route-chip').forEach(c => c.classList.remove('active'));
      renderSuggestions('');
    });
  }

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// ============================================================================
// 8. RESILIENT LIVE NOWCASTING ENGINE (FUTURE-PROOF MULTI-LAYER CONSENSUS)
// ============================================================================

function validateForecastPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  // Guarantee rainProfile has 12 valid non-negative numbers
  if (!Array.isArray(payload.rainProfile) || payload.rainProfile.length < 12) {
    const fallback = Array.isArray(payload.rainProfile) ? [...payload.rainProfile] : [];
    while (fallback.length < 12) fallback.push(0);
    payload.rainProfile = fallback.slice(0, 12).map(n => Math.max(0, Number(n) || 0));
  } else {
    payload.rainProfile = payload.rainProfile.slice(0, 12).map(n => Math.max(0, Number(n) || 0));
  }

  // Ensure stopMinutes is an integer
  payload.stopMinutes = Math.max(0, Math.round(Number(payload.stopMinutes) || 0));

  // Cross-consistency check: if stopMinutes is 0, ensure rain rate is 0
  if (payload.stopMinutes === 0 && payload.rainIntensity !== 'dry_now') {
    payload.rainIntensity = 'dry_now';
  } else if (payload.stopMinutes > 0 && payload.rainIntensity === 'dry_now') {
    payload.rainIntensity = 'light';
  }

  return payload;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  } else {
    return await fetch(url, options);
  }
}

// fetchWithTimeout only covers the headers: bound the body read too (large payloads).
function readJsonWithTimeout(res, timeoutMs = 15000) {
  let id = null;
  const timer = new Promise((_, reject) => {
    id = setTimeout(() => reject(new Error(`body read timed out after ${timeoutMs} ms`)), timeoutMs);
  });
  return Promise.race([Promise.resolve().then(() => res.json()), timer]).finally(() => clearTimeout(id));
}

let lastSuccessfulFetchTime = 0;

// A ground report only changes the "now" state; the future still comes from the forecast,
// and the leave-time engine weighs the report with a decaying influence.
function applyGroundReport(payload) {
  const report = activeGroundReport();
  if (!report || !payload) return payload;
  const profile = Array.isArray(payload.rainProfile) ? [...payload.rainProfile] : new Array(12).fill(0);
  if (report.type === 'rain') {
    for (let i = 0; i < 3; i++) profile[i] = Math.max(profile[i] || 0, 1.0);
    payload.skyTitle = "Raining Here (You Reported)";
    payload.skyIcon = "🌧️";
    payload.stopMinutes = Math.max(payload.stopMinutes || 0, 15);
    if (payload.rainIntensity === 'dry_now') payload.rainIntensity = 'light';
  } else {
    for (let i = 0; i < 3; i++) profile[i] = 0;
    payload.skyTitle = "Dry Here (You Reported)";
    payload.skyIcon = "☀️";
    payload.stopMinutes = 0;
    payload.rainIntensity = 'dry_now';
    payload.lightning = false;
    payload.puddleRisk = "Dry (< 1 cm)";
  }
  payload.rainProfile = profile;
  return payload;
}

async function fetchLiveOpenMeteo(lat = 26.5123, lon = 80.2329, placeName = "IIT Kanpur, Uttar Pradesh") {
  try {
    if (appState.activeScenario === 'live') document.getElementById('livePulsingDot').textContent = "● FETCHING LIVE...";
    // Multi-model, ensemble and radar load in parallel and refine the leave plan as they arrive.
    fetchForecastExtras(lat, lon);
    
    // Request 48-hour window (forecast_days=2). timeformat=unixtime gives UTC epoch seconds,
    // so slot alignment does not depend on the browser's timezone matching the location's.
    // NOTE: outside Central Europe / North America, Open-Meteo's minutely_15 data is
    // interpolated from hourly model output (not radar), so this is a model forecast.
    // The extra current/hourly/daily fields feed the conditions card (parseMetrics).
    // past_hours=3: hourly starts ≥ 3 h before now (3-h pressure tendency just after local
    // midnight); forecast_hours=48 keeps it from growing to 16 days. minutely_15 / daily are
    // unaffected, and every hourly consumer selects by time, never by position.
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,apparent_temperature,relative_humidity_2m,wind_gusts_10m,wind_direction_10m,uv_index,cloud_cover,is_day,pressure_msl&minutely_15=precipitation,weather_code&hourly=precipitation,weather_code,temperature_2m,precipitation_probability,pressure_msl&daily=sunrise,sunset,uv_index_max&forecast_days=2&past_hours=3&forecast_hours=48&timeformat=unixtime&timezone=auto`;
    const res = await fetchWithTimeout(url, {}, 6500);
    if (!res.ok) throw new Error("API error: " + res.status);
    const json = await res.json();
    // Drop responses for a location the user has already moved away from (e.g. cached
    // location fetch finishing after the GPS fix) — they would clobber the newer data.
    if (!sameSpot(appState.originCoords, { lat, lon })) return;

    const metrics = parseMetrics(json);
    if (metrics) { metrics.lat = lat; metrics.lon = lon; }
    appState.metrics = metrics;

    const cur = json.current || {};
    const wcode = Number(cur.weather_code) || 0;
    const wind = cur.wind_speed_10m !== undefined ? cur.wind_speed_10m : 10;
    const temp = cur.temperature_2m !== undefined ? cur.temperature_2m : 26;
    const nowSec = Date.now() / 1000;

    // 1. Timestamp alignment. Open-Meteo precipitation at time T is the SUM over the
    // preceding 15 minutes (T-15m → T), in mm. The slot covering "now" is the first one
    // whose end time is >= now. Multiply by 4 to convert mm/15min → mm/h.
    const m15 = json.minutely_15 || {};
    const m15Time = Array.isArray(m15.time) ? m15.time : [];
    const m15Precip = Array.isArray(m15.precipitation) ? m15.precipitation : [];
    const m15Codes = Array.isArray(m15.weather_code) ? m15.weather_code : [];
    const startIndex = m15Time.findIndex(t => t >= nowSec);

    // Usable series = from "now" up to the first missing (null) value. A null is the end
    // of the data, not a dry slot.
    const slotRates = [];
    const slotTimes = [];
    if (startIndex !== -1) {
      for (let k = startIndex; k < m15Time.length; k++) {
        const p = m15Precip[k];
        if (p === null || p === undefined || !Number.isFinite(Number(p))) break;
        slotRates.push(Math.max(0, Number(p)) * 4);
        slotTimes.push(m15Time[k]);
      }
    }
    // Without a 15-minute series we can't say when rain stops — treat as a failed fetch
    // (falls back to a recent cached forecast) instead of guessing.
    if (!slotRates.length) throw new Error("No usable minutely_15 precipitation data");
    const bundleNow = ensureBundle(lat, lon);
    bundleNow.a0 = { group: 'det', system: 'best_match', stepSec: 900, endTimes: slotTimes, rates: slotRates };
    bundleNow.a0At = Date.now();

    // 2. Is it raining now? Precipitation is reported in 0.1 mm steps, so any non-zero
    // value (>= 0.4 mm/h) is real rain/drizzle. Rate is the only wet test, so the stop
    // time, chart profile and wetness engine always agree.
    const isWetSlot = (i) => slotRates[i] > 0;
    const isRainingNow = isWetSlot(0);
    const currentPrecip = slotRates[0];

    // 3. When does it stop? First future slot that is dry; stop time = START of that slot.
    let stopMins = 0;
    let stopBeyondHorizon = false;
    if (isRainingNow) {
      const dryIdx = slotRates.findIndex((_, i) => i > 0 && !isWetSlot(i));
      if (dryIdx !== -1) {
        const dryStartSec = slotTimes[dryIdx] - 900;
        stopMins = Math.max(1, Math.round((dryStartSec - nowSec) / 60));
      } else {
        // No dry slot in the whole forecast window — don't invent a number.
        stopBeyondHorizon = true;
        const lastSec = slotTimes[slotTimes.length - 1];
        stopMins = Math.max(1, Math.round((lastSec - nowSec) / 60));
      }
    }

    // 4. 60-minute profile in 5-minute buckets (what the chart, slider and wetness engine
    // expect). Each bucket takes the slot that contains its midpoint in real time, since
    // slot 0 can end anywhere 0-15 min after now.
    const minutelyPrecip = [];
    for (let i = 0; i < 12; i++) {
      const tMid = nowSec + i * 300 + 150;
      const k = slotTimes.findIndex(t => t >= tMid);
      minutelyPrecip.push(k !== -1 ? +slotRates[k].toFixed(1) : 0);
    }

    // Next 3-hour horizon. Hourly precipitation at time T = sum over (T-1h, T].
    const hourly = json.hourly || {};
    const hTime = Array.isArray(hourly.time) ? hourly.time : [];
    const hourlyAt = (arr, offsetH, fallback) => {
      const idx = hTime.findIndex(t => t >= nowSec + (offsetH - 1) * 3600 + 1800);
      return (idx !== -1 && Array.isArray(arr) && arr[idx] !== undefined && arr[idx] !== null) ? arr[idx] : fallback;
    };
    const hourlyPrecipSlice = [1, 2, 3].map(h => hourlyAt(hourly.precipitation, h, 0));
    const hourlyWcodeSlice = [1, 2, 3].map(h => hourlyAt(hourly.weather_code, h, 0));
    const hourlyTempSlice = [1, 2, 3].map(h => hourlyAt(hourly.temperature_2m, h, temp));

    // 4. Condition Headline & Icon
    let conditionTitle = "Clear Sky / Dry";
    let conditionIcon = "🌤️";
    if (isRainingNow) {
      if (wcode >= 95 || currentPrecip > 8) {
        conditionTitle = "Severe Thunderstorm Downpour";
        conditionIcon = "⛈️";
      } else if (currentPrecip > 4 || wcode >= 65 || wcode >= 82) {
        conditionTitle = "Heavy Rain Shower";
        conditionIcon = "🌧️";
      } else if (currentPrecip > 1 || wcode >= 63 || wcode >= 81) {
        conditionTitle = "Moderate Rain";
        conditionIcon = "🌧️";
      } else {
        conditionTitle = "Light Drizzle";
        conditionIcon = "🌦️";
      }
    } else {
      if (wcode >= 95) {
        conditionTitle = "Thunderstorm in Vicinity (Dry Overhead)";
        conditionIcon = "⛅";
      } else if (wcode >= 80) {
        conditionTitle = "Passing Rain Clouds (Dry Now)";
        conditionIcon = "⛅";
      } else if (wcode >= 1 && wcode <= 3) {
        conditionTitle = "Partly Cloudy";
        conditionIcon = "⛅";
      } else {
        conditionTitle = "Clear Sky / Dry";
        conditionIcon = "☀️";
      }
    }

    const payload = {
      name: `Live: ${placeName}`,
      skyTitle: conditionTitle,
      skySubtitle: `📍 ${placeName} (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E) • ${temp}°C • ${wind} km/h wind`,
      skyIcon: conditionIcon,
      stopMinutes: stopMins,
      rainProfile: minutelyPrecip.length >= 12 
        ? minutelyPrecip.slice(0, 12) 
        : [currentPrecip, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      windSpeed: Math.round(wind),
      puddleRisk: currentPrecip > 4 ? "High (4-6 cm)" : currentPrecip > 1 ? "Moderate (2-3 cm)" : "Dry (< 1 cm)",
      rainIntensity: !isRainingNow ? 'dry_now' : currentPrecip > 7.6 ? 'heavy' : currentPrecip > 2.5 ? 'moderate' : 'light',
      lightning: (wcode >= 95 && isRainingNow) || currentPrecip > 8,
      adviceHeadline: stopBeyondHorizon
        ? `No dry break forecast for ${formatStopShort({ stopBeyondHorizon: true, stopMinutes: stopMins })}`
        : stopMins > 0 ? `Rain easing in ~${stopMins} mins (Wait 1 Chai)` : `100% Clear Skies at ${placeName.split(',')[0]}`,
      adviceDesc: stopBeyondHorizon
        ? `Forecast model shows continuous precipitation (${currentPrecip.toFixed(1)} mm/h now) through the whole forecast window. Waiting won't help — take gear or a cab.`
        : stopMins > 0
        ? `Forecast model shows active precipitation (${currentPrecip.toFixed(1)} mm/h). Stepping out now without gear will get you wet. Rain expected to clear in ~${stopMins} mins.`
        : `No precipitation forecast over ${placeName.split(',')[0]} right now. Good time to step out.`,
      routePockets: [
        { name: "Origin Point", dist: "0.0 km", rain: currentPrecip > 4 ? "heavy" : currentPrecip > 0.3 ? "light" : "dry", text: `${currentPrecip.toFixed(1)} mm/h` },
        { name: "Mid Route", dist: `${(appState.routeDistanceKm * 0.5).toFixed(1)} km`, rain: currentPrecip > 2 ? "moderate" : currentPrecip > 0.3 ? "light" : "dry", text: `${(currentPrecip * 0.7).toFixed(1)} mm/h` },
        { name: "Destination", dist: `${appState.routeDistanceKm.toFixed(1)} km`, rain: stopMins > 30 ? "light" : "dry", text: stopMins > 30 ? "0.5 mm/h" : "0 mm/h" }
      ],
      routeAlert: isRainingNow
        ? `⚠️ Forecast alert: Active precipitation (${currentPrecip.toFixed(1)} mm/h) over travel route.`
        : `🟢 Clear skies detected along travel route.`,
      hourlyPrecip: hourlyPrecipSlice,
      hourlyWcode: hourlyWcodeSlice,
      hourlyTemp: hourlyTempSlice,
      stopBeyondHorizon
    };

    // Re-apply a recent "Rain Here" / "Dry Here" report (affects "now" only; expires in 30 min).
    applyGroundReport(payload);

    // 5. Sanity Audit & Local Cache Storage with Timestamp
    const validated = validateForecastPayload(payload);
    SCENARIOS.live = validated;
    lastSuccessfulFetchTime = Date.now();

    try {
      localStorage.setItem('rainstop_cached_forecast_v3', JSON.stringify({
        timestamp: Date.now(),
        lat, lon,
        data: validated,
        metrics: appState.metrics
      }));
    } catch (e) { /* storage full / private mode: cache is optional */ }

    if (appState.activeScenario !== 'live') return; // a simulation is on screen; keep live data for later
    appState.currentScenarioData = validated;
    const shortPlace = placeName.split(',')[0].trim();
    document.getElementById('livePulsingDot').textContent = `● LIVE (${shortPlace})`;
    updateUI();
  } catch (err) {
    console.warn("Live weather fetch failed, attempting cached fallback:", err);
    if (!sameSpot(appState.originCoords, { lat, lon })) return; // stale request for an old location
    // v3 key: older caches stored mm/15min values in 15-minute buckets — never reuse them.
    const rawCached = localStorage.getItem('rainstop_cached_forecast_v3');
    if (rawCached) {
      try {
        const parsed = JSON.parse(rawCached);
        const data = parsed.data;
        const cacheAgeMins = parsed.timestamp ? Math.round((Date.now() - parsed.timestamp) / 60000) : 999;

        if (data && cacheAgeMins < 30 && sameSpot(parsed, { lat, lon })) {
          // stopMinutes and rainProfile are relative to fetch time — age them to "now".
          if (data.stopMinutes > 0) {
            data.stopMinutes = data.stopBeyondHorizon
              ? Math.max(1, data.stopMinutes - cacheAgeMins)
              : Math.max(0, data.stopMinutes - cacheAgeMins);
          }
          if (Array.isArray(data.rainProfile) && data.rainProfile.length) {
            const shift = Math.min(data.rainProfile.length - 1, Math.floor(cacheAgeMins / 5));
            const last = data.rainProfile[data.rainProfile.length - 1];
            data.rainProfile = data.rainProfile.slice(shift).concat(Array(shift).fill(last));
          }
          SCENARIOS.live = validateForecastPayload(data);
          if (parsed.metrics && typeof parsed.metrics === 'object') appState.metrics = parsed.metrics;
          if (appState.activeScenario !== 'live') return;
          appState.currentScenarioData = SCENARIOS.live;
          document.getElementById('livePulsingDot').textContent = `● CACHED (${cacheAgeMins}m ago)`;
          updateUI();
          return;
        }
      } catch (e) { /* ignore */ }
    }
    // No fresh or recent data: don't keep showing a "dry" default as if it were a forecast.
    if (appState.activeScenario === 'live') {
      SCENARIOS.live.skyTitle = "Forecast Unavailable";
      SCENARIOS.live.skySubtitle = "Couldn't load weather data — retrying automatically";
      SCENARIOS.live.skyIcon = "❔";
      SCENARIOS.live.adviceHeadline = "No live data — check the sky yourself";
      SCENARIOS.live.adviceDesc = "Weather data could not be loaded. Use the Rain Here / Dry Here buttons to set conditions manually.";
      appState.currentScenarioData = SCENARIOS.live;
      updateUI();
    }
    if (appState.activeScenario === 'live') document.getElementById('livePulsingDot').textContent = "● OFFLINE FALLBACK";
  }
}

// ============================================================================
// 8.5 MULTI-MODEL + ENSEMBLE + RADAR FETCHERS (feed the leave-time engine)
// ============================================================================
// Every source is optional and fails independently; the UI improves as each arrives.

const DET_MODELS = ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'jma_seamless'];
const ENS_MODELS = ['ecmwf_ifs025', 'gfs025', 'icon_global_eps'];
const DET_TTL_MS = 10 * 60000;
const ENS_TTL_MS = 30 * 60000;
const RADAR_TTL_MS = 5 * 60000;
const DET_MAX_AGE_MS = 3 * 3600000;
const ENS_MAX_AGE_MS = 6 * 3600000;
const BUNDLE_CACHE_KEY = 'rainstop_bundle_v1';
const RADAR_SAMPLE_ZOOM = 7; // RainViewer serves z <= 7 only

function sameSpot(a, b) {
  return !!a && !!b && Math.abs(a.lat - b.lat) < 0.02 && Math.abs(a.lon - b.lon) < 0.02;
}

function ensureBundle(lat, lon) {
  if (!sameSpot(appState.forecastBundle, { lat, lon })) {
    appState.forecastBundle = { lat, lon, a0: null, det: null, detAt: 0, ens: null, ensAt: 0 };
    loadBundleCache(lat, lon);
  }
  return appState.forecastBundle;
}

function saveBundleCache() {
  const b = appState.forecastBundle;
  if (!b) return;
  try {
    localStorage.setItem(BUNDLE_CACHE_KEY, JSON.stringify({
      lat: b.lat, lon: b.lon, det: b.det, detAt: b.detAt, ens: b.ens, ensAt: b.ensAt
    }));
  } catch (e) { /* quota or private mode: cache is optional */ }
}

function loadBundleCache(lat, lon) {
  try {
    const c = JSON.parse(localStorage.getItem(BUNDLE_CACHE_KEY) || 'null');
    if (!c || !sameSpot(c, { lat, lon })) return;
    const b = appState.forecastBundle;
    if (c.det && Date.now() - c.detAt < DET_MAX_AGE_MS) { b.det = c.det; b.detAt = c.detAt; }
    if (c.ens && Date.now() - c.ensAt < ENS_MAX_AGE_MS) { b.ens = c.ens; b.ensAt = c.ensAt; }
  } catch (e) { /* ignore corrupt cache */ }
}

// Deterministic models at 15-min steps. Values are mm per 15 min -> x4 = mm/h.
async function fetchDetModels(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation&models=${DET_MODELS.join(',')}&forecast_days=2&timeformat=unixtime`;
  const res = await fetchWithTimeout(url, {}, 6500);
  if (!res.ok) throw new Error('multi-model API ' + res.status);
  const json = await res.json();
  const m = json.minutely_15 || {};
  if (!Array.isArray(m.time)) throw new Error('multi-model: no time axis');
  return DET_MODELS
    .filter(model => Array.isArray(m[`precipitation_${model}`]))
    .map(model => ({
      group: 'det', system: model, stepSec: 900, endTimes: m.time,
      rates: m[`precipitation_${model}`].map(v => (v === null || v === undefined) ? null : Math.max(0, v) * 4)
    }))
    .filter(s => s.rates.some(v => v !== null));
}

// Ensemble members, hourly. Hourly value in mm == mean rate in mm/h for that hour.
async function fetchEnsemble(lat, lon) {
  const url = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lon}&hourly=precipitation&models=${ENS_MODELS.join(',')}&forecast_days=2&timeformat=unixtime`;
  const res = await fetchWithTimeout(url, {}, 9000);
  if (!res.ok) throw new Error('ensemble API ' + res.status);
  const json = await res.json();
  const h = json.hourly || {};
  if (!Array.isArray(h.time)) throw new Error('ensemble: no time axis');
  return Object.keys(h)
    .filter(k => k.startsWith('precipitation') && Array.isArray(h[k]))
    .map(k => ({
      group: 'ens',
      // precipitation_member07_ecmwf_ifs025_ensemble -> ecmwf_ifs025_ensemble (members of one system averaged together)
      system: k.replace(/^precipitation_?/, '').replace(/member\d+_?/, '') || 'ens',
      stepSec: 3600, endTimes: h.time,
      rates: h[k].map(v => (v === null || v === undefined) ? null : Math.max(0, v))
    }))
    .filter(s => s.rates.some(v => v !== null));
}

async function fetchForecastExtras(lat, lon) {
  const bundle = ensureBundle(lat, lon);
  const now = Date.now();
  const jobs = [];

  if (now - bundle.detAt > DET_TTL_MS) {
    jobs.push(fetchDetModels(lat, lon).then(det => {
      if (appState.forecastBundle !== bundle || !det.length) return;
      bundle.det = det; bundle.detAt = Date.now();
      saveBundleCache(); updateUI();
    }).catch(err => console.warn('Multi-model fetch failed:', err)));
  }
  if (now - bundle.ensAt > ENS_TTL_MS) {
    jobs.push(fetchEnsemble(lat, lon).then(ens => {
      if (appState.forecastBundle !== bundle || !ens.length) return;
      bundle.ens = ens; bundle.ensAt = Date.now();
      saveBundleCache(); updateUI();
    }).catch(err => console.warn('Ensemble fetch failed:', err)));
  }
  if (!appState.radar || !appState.radar.fetchedAt || now - appState.radar.fetchedAt > RADAR_TTL_MS || !sameSpot(appState.radar, { lat, lon })) {
    jobs.push(refreshRadar(lat, lon).catch(err => console.warn('Radar refresh failed:', err)));
  }
  // Experimental forecast rain map (no-op without a map / when the layer is off; 30-min TTL)
  jobs.push(refreshForecastGrid().catch(err => console.warn('Forecast grid refresh failed:', err)));
  // India-wide wind / pressure field (no-op unless a layer is on at India zoom; 60-min TTL)
  jobs.push(refreshIndiaField().catch(err => console.warn('India model refresh failed:', err)));
  // GDACS active cyclones (30-min TTL; never throws)
  jobs.push(refreshCyclones().catch(err => console.warn('Cyclone refresh failed:', err)));
  await Promise.all(jobs);
}

// ---------------------------------------------------------------------------
// RainViewer radar: map overlay + positive-only "rain observed here" signal.
// Radar coverage over India is patchy, so NO echo is never treated as "dry".
// ---------------------------------------------------------------------------

const RADAR_FRAME_COUNT = 13; // ~2 h of 10-min frames for the map loop

function latLonToTilePixel(lat, lon, z) {
  const n = Math.pow(2, z);
  const phi = lat * Math.PI / 180;
  const X = (lon + 180) / 360 * n * 256;
  const Y = (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2 * n * 256;
  return { x: Math.floor(X / 256), y: Math.floor(Y / 256), px: Math.floor(X % 256), py: Math.floor(Y % 256) };
}

async function fetchRadarMeta() {
  const res = await fetchWithTimeout('https://api.rainviewer.com/public/weather-maps.json', {}, 4000);
  if (!res.ok) throw new Error('RainViewer ' + res.status);
  const json = await res.json();
  const past = json.radar && Array.isArray(json.radar.past) ? json.radar.past : [];
  if (!json.host || !past.length) throw new Error('RainViewer: no frames');
  const frame = past[past.length - 1];
  // `frame` (latest) drives the "rain here" sample; `frames` drives the map loop.
  const frames = past.slice(-RADAR_FRAME_COUNT).filter(f => f && Number.isFinite(f.time) && typeof f.path === 'string');
  return { host: json.host, frame, frames, ageMin: Math.round((Date.now() / 1000 - frame.time) / 60) };
}

function sampleRadarAt(lat, lon, meta) {
  return new Promise(resolve => {
    if (typeof Image === 'undefined' || typeof document.createElement !== 'function') {
      resolve({ status: 'unavailable' });
      return;
    }
    const t = latLonToTilePixel(lat, lon, RADAR_SAMPLE_ZOOM);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve({ status: 'unavailable' }), 4000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const px = ctx.getImageData(0, 0, 256, 256).data;
        const alphaAt = (x, y) => (x < 0 || y < 0 || x > 255 || y > 255) ? 0 : px[(y * 256 + x) * 4 + 3];
        let centre = 0, nearby = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (alphaAt(t.px + dx, t.py + dy) > 0) centre++;
        // ~12 px at z7 ≈ 13 km at 26°N
        for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) if (alphaAt(t.px + dx, t.py + dy) > 0) nearby++;
        const echo = alphaAt(t.px, t.py) > 0 && centre >= 3;
        resolve({ status: echo ? 'echo' : 'none', nearby: !echo && nearby >= 5 });
      } catch (e) {
        resolve({ status: 'unavailable' });
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve({ status: 'unavailable' }); };
    img.src = `${meta.host}${meta.frame.path}/256/${RADAR_SAMPLE_ZOOM}/${t.x}/${t.y}/2/1_1.png`;
  });
}

// Entry point for a fresh RainViewer frame list (refreshRadar calls it): keeps the radar
// frame layers and the map timeline in sync without interrupting playback.
function updateRadarOverlay(meta) {
  appState.radarMeta = meta;
  syncRadarFrames();
}

async function refreshRadar(lat, lon) {
  let meta;
  try {
    meta = await fetchRadarMeta();
  } catch (e) {
    appState.radar = { status: 'unavailable', fetchedAt: Date.now(), lat, lon };
    return;
  }
  updateRadarOverlay(meta);
  const stale = meta.ageMin > 20;
  const sample = stale ? { status: 'stale' } : await sampleRadarAt(lat, lon, meta);
  if (!sameSpot(appState.forecastBundle, { lat, lon })) return; // location changed meanwhile
  appState.radar = { ...sample, frameTime: meta.frame.time, ageMin: meta.ageMin, fetchedAt: Date.now(), lat, lon };
  updateUI();
}

// ============================================================================
// 8.6 RAIN MAP: RADAR LOOP + FORECAST-MODEL GRID + LAYERS (pure helpers first)
// ============================================================================
// One timeline: the last ~2 h of RainViewer radar frames, then up to 6 hourly frames of
// an experimental Open-Meteo forecast grid. Radar coverage over India is patchy and the
// grid is a coarse model (~10–25 km), so it is labelled "FORECAST MODEL", never radar.

const GRID_N = 7;                 // 7 × 7 = 49 forecast points
const GRID_STEP = 0.12;           // degrees between points (~13 km)
const GRID_TTL_MS = 30 * 60000;   // refetch at most every 30 min
const GRID_CACHE_MAX_MS = 45 * 60000;
const GRID_CACHE_KEY = 'rainstop_grid_v1';
const GRID_MAX_HOURS = 6;
const LAYERS_KEY = 'rainstop_layers_v1';
const RADAR_OPACITY = 0.6;
const RADAR_ATTRIBUTION = 'Radar © <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>';
const GIBS_IR_TILES = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png';
const SVG_NS = 'http://www.w3.org/2000/svg';

// Rain-rate colour scale (mm/h → rgba). Drives the grid image, the hourly chart bars and
// the legend so they always agree. Below 0.1 mm/h is transparent.
const RAIN_SCALE = [
  { mm: 0.1, rgb: [125, 211, 252], a: 0.35 },
  { mm: 1, rgb: [56, 189, 248], a: 0.5 },
  { mm: 2.5, rgb: [37, 99, 235], a: 0.6 },
  { mm: 4, rgb: [34, 197, 94], a: 0.65 },
  { mm: 8, rgb: [250, 204, 21], a: 0.7 },
  { mm: 16, rgb: [249, 115, 22], a: 0.75 },
  { mm: 30, rgb: [220, 38, 38], a: 0.8 },
  { mm: 50, rgb: [217, 70, 239], a: 0.85 }
];

function rainColor(mmh) {
  const v = Number(mmh);
  if (!Number.isFinite(v) || v < RAIN_SCALE[0].mm) return [0, 0, 0, 0];
  const last = RAIN_SCALE[RAIN_SCALE.length - 1];
  if (v >= last.mm) return [...last.rgb, last.a];
  let i = 0;
  while (v >= RAIN_SCALE[i + 1].mm) i++;
  const lo = RAIN_SCALE[i], hi = RAIN_SCALE[i + 1];
  const f = (v - lo.mm) / (hi.mm - lo.mm);
  const mix = (x, y) => Math.round(x + (y - x) * f);
  return [mix(lo.rgb[0], hi.rgb[0]), mix(lo.rgb[1], hi.rgb[1]), mix(lo.rgb[2], hi.rgb[2]), +(lo.a + (hi.a - lo.a) * f).toFixed(3)];
}

// Legend gradient (opaque so it reads on any map).
function rainLegendGradient() {
  const n = RAIN_SCALE.length - 1;
  return `linear-gradient(90deg, ${RAIN_SCALE.map((s, i) => `rgb(${s.rgb.join(',')}) ${Math.round(i / n * 100)}%`).join(', ')})`;
}

// 7 × 7 lattice centred on the start point snapped to the 0.12° grid (so nearby spots
// share one cache entry). Rows run north → south, columns west → east.
function buildGridPoints(lat, lon, n = GRID_N, step = GRID_STEP) {
  const snap = v => +(Math.round(v / step) * step).toFixed(4);
  const lat0 = snap(lat);
  const lon0 = snap(lon);
  const half = (n - 1) / 2;
  const points = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      points.push({ lat: +(lat0 + (half - row) * step).toFixed(4), lon: +(lon0 + (col - half) * step).toFixed(4), row, col });
    }
  }
  return { lat0, lon0, step, n, points };
}

// Open-Meteo multi-location response → hourly rain grids. `spec` is buildGridPoints()
// output. Hourly precipitation at T is the total over (T-1h, T]; only hours ending after
// `nowSec` are kept (max 6). Missing values become NaN (drawn transparent).
function parseGridResponse(json, spec, nowSec = Date.now() / 1000) {
  const list = Array.isArray(json) ? json : [json];
  if (!spec || !Array.isArray(spec.points) || list.length !== spec.points.length) {
    throw new Error(`grid: expected ${spec && spec.points ? spec.points.length : '?'} points, got ${list.length}`);
  }
  const first = list[0] && list[0].hourly;
  if (!first || !Array.isArray(first.time)) throw new Error('grid: no time axis');
  const hourIdx = [];
  first.time.forEach((t, i) => { if (Number(t) > nowSec && hourIdx.length < GRID_MAX_HOURS) hourIdx.push(i); });
  const val = (arr, i) => {
    const v = Array.isArray(arr) ? arr[i] : null;
    return (v === null || v === undefined || !Number.isFinite(Number(v))) ? NaN : Number(v);
  };
  const precip = hourIdx.map(i => list.map(p => val(p && p.hourly && p.hourly.precipitation, i)));
  const prob = hourIdx.map(i => list.map(p => val(p && p.hourly && p.hourly.precipitation_probability, i)));
  return {
    lat0: spec.lat0, lon0: spec.lon0, step: spec.step, n: spec.n,
    times: hourIdx.map(i => Number(first.time[i])),
    precip, prob, fetchedAt: Date.now()
  };
}

// Merge radar frames (past) and model hours (future) into one ordered timeline.
// Default position = the latest radar frame ("now"); without radar, the first model hour.
function buildTimelineFrames(radarMeta, grid, nowSec = Date.now() / 1000) {
  const frames = [];
  const radar = radarMeta && Array.isArray(radarMeta.frames) ? radarMeta.frames.filter(f => f && Number.isFinite(f.time)) : [];
  const lastRadarT = radar.length ? Math.max(...radar.map(f => f.time)) : -Infinity;
  radar.forEach(f => {
    const ago = Math.round((lastRadarT - f.time) / 60);
    frames.push({ kind: 'radar', t: f.time, path: f.path, label: fmtClock(new Date(f.time * 1000)), rel: ago <= 0 ? 'now' : `−${ago} min` });
  });
  if (grid && Array.isArray(grid.times)) {
    let added = 0;
    grid.times.forEach((t, hourIdx) => {
      if (added >= GRID_MAX_HOURS || !(t > lastRadarT) || !(t > nowSec)) return;
      added++;
      const h = Math.max(1, Math.round((t - nowSec) / 3600));
      // src: 'grid' = local 7 × 7 rain grid, 'india' = India-wide wind/pressure field
      frames.push({ kind: 'model', t, hourIdx, src: grid.src || 'grid', label: fmtClock(new Date(t * 1000)), rel: `+${h} h` });
    });
  }
  frames.sort((a, b) => a.t - b.t);
  let defaultIndex = -1;
  frames.forEach((f, i) => { if (f.kind === 'radar') defaultIndex = i; });
  if (defaultIndex === -1 && frames.length) defaultIndex = 0;
  return { frames, defaultIndex };
}

// ---------------------------------------------------------------------------
// Live conditions (feels like, wind, UV, sun, hourly chance) from the main A0 response.
// ---------------------------------------------------------------------------

function parseMetrics(json, nowSec = Date.now() / 1000) {
  if (!json || typeof json !== 'object') return null;
  const num = v => (v === null || v === undefined || v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v))) ? null : Number(v);
  const at = (arr, i) => (Array.isArray(arr) && i < arr.length ? num(arr[i]) : null);
  const obj = o => (o && typeof o === 'object' ? o : {});
  const cur = obj(json.current);
  const daily = obj(json.daily);
  const hourly = obj(json.hourly);
  const hTime = Array.isArray(hourly.time) ? hourly.time : [];
  // Hour ending after now = the hour in progress (values cover (T-1h, T]).
  const start = hTime.findIndex(t => Number(t) > nowSec);
  const hours = [];
  if (start !== -1) {
    for (let i = start; i < hTime.length && hours.length < 12; i++) {
      hours.push({
        t: Number(hTime[i]),
        mm: at(hourly.precipitation, i),
        prob: at(hourly.precipitation_probability, i),
        tempC: at(hourly.temperature_2m, i),
        code: at(hourly.weather_code, i)
      });
    }
  }
  const isDay = num(cur.is_day);
  // 3-hour pressure tendency: latest hour at/before now vs 3 h earlier (hourly MSL values are
  // instantaneous). null when the series doesn't reach back 3 h.
  let pressureTrend3h = null;
  let i0 = -1;
  hTime.forEach((t, i) => { if (Number(t) <= nowSec) i0 = i; });
  if (i0 >= 3) {
    const pNow = at(hourly.pressure_msl, i0);
    const pThen = at(hourly.pressure_msl, i0 - 3);
    if (pNow !== null && pThen !== null) pressureTrend3h = +(pNow - pThen).toFixed(1);
  }
  return {
    at: num(cur.time),
    tempC: num(cur.temperature_2m),
    feelsC: num(cur.apparent_temperature),
    humidity: num(cur.relative_humidity_2m),
    windKmh: num(cur.wind_speed_10m),
    gustKmh: num(cur.wind_gusts_10m),
    windDirDeg: num(cur.wind_direction_10m), // direction the wind blows FROM
    uv: num(cur.uv_index),
    uvMax: at(daily.uv_index_max, 0),
    cloudPct: num(cur.cloud_cover),
    isDay: isDay === null ? null : isDay === 1,
    sunrise: at(daily.sunrise, 0),
    sunset: at(daily.sunset, 0),
    sunriseNext: at(daily.sunrise, 1),
    sunsetNext: at(daily.sunset, 1),
    pressureHpa: num(cur.pressure_msl),
    pressureTrend3h,
    hourly: hours
  };
}

const isNum = v => typeof v === 'number' && Number.isFinite(v);

function fmtTemp(c) {
  return isNum(c) ? `${Math.round(c)}°` : '–';
}

function fmtWindDir(deg) {
  if (!isNum(deg)) return '–';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

// WHO UV categories on the rounded index.
function uvLevel(uv) {
  if (!isNum(uv)) return null;
  const u = Math.round(uv);
  if (u <= 2) return { label: 'Low', tone: 'ok' };
  if (u <= 5) return { label: 'Moderate', tone: 'neutral' };
  if (u <= 7) return { label: 'High', tone: 'warn' };
  if (u <= 10) return { label: 'Very high', tone: 'bad' };
  return { label: 'Extreme', tone: 'bad' };
}

function nextSunEvent(m, nowSec = Date.now() / 1000) {
  if (!m) return null;
  const events = [['sunrise', m.sunrise], ['sunset', m.sunset], ['sunrise', m.sunriseNext], ['sunset', m.sunsetNext]]
    .filter(([, t]) => isNum(t) && t > nowSec)
    .sort((a, b) => a[1] - b[1]);
  return events.length ? { kind: events[0][0], t: events[0][1] } : null;
}

function radarMetricCard(radar, nowSec) {
  const card = { id: 'radar', label: 'Radar', tone: 'neutral' };
  if (!radar) return { ...card, value: 'Loading…', sub: 'RainViewer' };
  const age = radar.frameTime ? Math.max(0, Math.round((nowSec - radar.frameTime) / 60)) : null;
  const ageTxt = age !== null ? `frame ${age} min old` : 'RainViewer';
  if (radar.status === 'echo') return { ...card, value: 'Rain here', sub: ageTxt, tone: 'bad' };
  if (radar.status === 'none' && radar.nearby) return { ...card, value: 'Rain nearby', sub: `within ~13 km · ${ageTxt}`, tone: 'warn' };
  if (radar.status === 'none') return { ...card, value: 'No echo', sub: `patchy coverage · ${ageTxt}` };
  if (radar.status === 'stale') return { ...card, value: 'Stale', sub: ageTxt };
  return { ...card, value: 'Unavailable', sub: 'RainViewer' };
}

// Sea-level pressure + 3-h tendency card. Falling ≥ 4 hPa / 3 h is flagged (warn).
function pressureMetricCard(m) {
  const card = { id: 'pressure', label: 'Pressure', value: '–', sub: '', tone: 'neutral' };
  if (!m || !isNum(m.pressureHpa)) return card;
  card.value = `${Math.round(m.pressureHpa)} hPa`;
  const d = m.pressureTrend3h;
  if (isNum(d)) {
    card.sub = Math.abs(d) < 1 ? 'steady' : `${d < 0 ? 'falling' : 'rising'} ${Math.abs(d).toFixed(1)} hPa / 3 h`;
    if (d <= -4) card.tone = 'warn';
  } else {
    card.sub = 'sea level';
  }
  return card;
}

// Metric cards for the conditions grid. Always 9 cards; missing values show "–".
function metricCards(m, radar, nowSec = Date.now() / 1000) {
  const dash = '–';
  const has = k => !!m && isNum(m[k]);
  const h0 = m && Array.isArray(m.hourly) ? (m.hourly.find(p => p.t > nowSec) || null) : null;
  const uv = m ? uvLevel(m.uv) : null;
  const sun = nextSunEvent(m, nowSec);
  const clock = t => fmtClock(new Date(t * 1000));
  const cloudWord = !has('cloudPct') ? '' : m.cloudPct >= 85 ? 'Overcast' : m.cloudPct >= 50 ? 'Mostly cloudy' : m.cloudPct >= 20 ? 'Partly cloudy' : 'Clear';
  const humidWord = !has('humidity') ? '' : m.humidity >= 85 ? 'Very humid' : m.humidity >= 60 ? 'Humid' : m.humidity >= 30 ? 'Comfortable' : 'Dry air';
  let sunSub = '';
  if (sun && sun.kind === 'sunset' && has('sunrise')) sunSub = `Sunrise ${clock(m.sunrise)}`;
  else if (sun && sun.kind === 'sunrise' && has('sunset')) sunSub = `Sunset ${clock(m.sunset)}`;

  return [
    { id: 'feels', label: 'Feels like', value: has('feelsC') ? fmtTemp(m.feelsC) : dash, sub: has('tempC') ? `Actual ${fmtTemp(m.tempC)}` : '', tone: 'neutral' },
    {
      id: 'rain', label: 'Rain next hour',
      value: h0 && isNum(h0.prob) ? `${Math.round(h0.prob)}%` : dash,
      sub: h0 && isNum(h0.mm) ? `${h0.mm.toFixed(1)} mm expected` : 'chance of rain',
      tone: !h0 || !isNum(h0.prob) ? 'neutral' : h0.prob >= 60 ? 'bad' : h0.prob >= 30 ? 'warn' : 'ok'
    },
    {
      id: 'wind', label: 'Wind',
      value: has('windKmh') ? `${Math.round(m.windKmh)} km/h` : dash,
      sub: [has('windDirDeg') ? `from ${fmtWindDir(m.windDirDeg)}` : '', has('gustKmh') ? `gusts ${Math.round(m.gustKmh)}` : ''].filter(Boolean).join(' · '),
      tone: has('gustKmh') && m.gustKmh >= 40 ? 'warn' : 'neutral',
      arrowDeg: has('windDirDeg') ? (m.windDirDeg + 180) % 360 : null // arrow points where the wind goes
    },
    { id: 'humidity', label: 'Humidity', value: has('humidity') ? `${Math.round(m.humidity)}%` : dash, sub: humidWord, tone: 'neutral' },
    {
      id: 'uv', label: 'UV index',
      value: has('uv') ? String(Math.round(m.uv)) : dash,
      sub: [uv ? uv.label : '', has('uvMax') ? `max ${Math.round(m.uvMax)}` : ''].filter(Boolean).join(' · '),
      tone: uv ? uv.tone : 'neutral'
    },
    { id: 'cloud', label: 'Cloud cover', value: has('cloudPct') ? `${Math.round(m.cloudPct)}%` : dash, sub: cloudWord, tone: 'neutral' },
    {
      id: 'sun', label: sun ? (sun.kind === 'sunset' ? 'Sunset' : 'Sunrise') : 'Sun',
      value: sun ? clock(sun.t) : dash, sub: sunSub, tone: 'neutral', next: sun ? sun.kind : null
    },
    pressureMetricCard(m),
    radarMetricCard(radar, nowSec)
  ];
}

// Hourly chart geometry: bar height ∝ rain chance, bar colour = rain amount, temperature
// line in the top 30% band, a time tick every 3 h. Pure (no DOM) so it is testable.
function buildHourlyChartModel(hourly, size) {
  const w = (size && size.w) || 336;
  const h = (size && size.h) || 120;
  const list = Array.isArray(hourly) ? hourly : [];
  const n = list.length;
  const plotH = h - 16;                       // 16 px for the time ticks
  const bandH = Math.round(plotH * 0.3);      // temperature band
  const barMaxH = plotH - bandH - 10;         // 10 px for the mm labels
  const slot = n ? w / n : w;
  const bw = Math.max(2, slot * 0.6);
  const bars = list.map((p, i) => {
    const prob = isNum(p.prob) ? Math.max(0, Math.min(100, p.prob)) : 0;
    const bh = prob / 100 * barMaxH;
    const mm = isNum(p.mm) ? p.mm : 0;
    const [r, g, b, a] = rainColor(Math.max(mm, 0.1));
    return {
      x: +(i * slot + (slot - bw) / 2).toFixed(1), y: +(plotH - bh).toFixed(1), w: +bw.toFixed(1), h: +bh.toFixed(1),
      fill: `rgba(${r}, ${g}, ${b}, ${Math.max(a, 0.55)})`, mmLabel: mm >= 0.1 ? mm.toFixed(1) : '', prob
    };
  });
  const tVals = list.map(p => p.tempC).filter(isNum);
  const tMax = tVals.length ? Math.max(...tVals) : 0;
  const tSpan = tVals.length ? (tMax - Math.min(...tVals)) || 1 : 1;
  const temps = [];
  let tempPath = '';
  let penDown = false;
  list.forEach((p, i) => {
    if (!isNum(p.tempC)) { penDown = false; return; }
    const x = +(i * slot + slot / 2).toFixed(1);
    const y = +(12 + (tMax - p.tempC) / tSpan * Math.max(1, bandH - 12)).toFixed(1);
    tempPath += `${tempPath ? ' ' : ''}${penDown ? 'L' : 'M'}${x} ${y}`;
    penDown = true;
    temps.push({ x, y, label: fmtTemp(p.tempC), showLabel: i % 3 === 0 });
  });
  const ticks = [];
  list.forEach((p, i) => { if (i % 3 === 0) ticks.push({ x: +(i * slot + slot / 2).toFixed(1), label: fmtClock(new Date(p.t * 1000)) }); });
  const maxProb = bars.reduce((mx, b) => Math.max(mx, b.prob), 0);
  return { w, h, plotH, bars, tempPath, temps, ticks, summary: n ? `Next ${n} h: rain chance up to ${Math.round(maxProb)}%` : 'No hourly data' };
}

// Bottom-sheet snap: a fling (|v| > 0.45 px/ms, + = upwards) moves one snap in that
// direction, otherwise the nearest snap wins. `snaps` = { peek, half, full } in px visible.
function snapSheetTarget(pos, velocityPxPerMs, snaps) {
  const order = Object.keys(snaps).sort((a, b) => snaps[a] - snaps[b]);
  if (Math.abs(velocityPxPerMs) > 0.45) {
    if (velocityPxPerMs > 0) return order.find(k => snaps[k] > pos + 1) || order[order.length - 1];
    return [...order].reverse().find(k => snaps[k] < pos - 1) || order[0];
  }
  return order.reduce((best, k) => (Math.abs(snaps[k] - pos) < Math.abs(snaps[best] - pos) ? k : best), order[0]);
}

// Sheet heights (px visible) for a viewport height and safe-area insets.
// minPeekContent = measured height of the head + timeline (so the legend isn't clipped).
function sheetSnapsFor(H, safeTop, safeBottom, minPeekContent) {
  const peek = Math.round(Math.max(148, minPeekContent || 0) + safeBottom);
  const full = Math.max(peek + 80, Math.round(H - (safeTop + 64)));
  const half = Math.min(full - 40, Math.max(peek + 40, Math.round(0.52 * H)));
  return { peek, half, full };
}

// ---------------------------------------------------------------------------
// Map panes + overlay layers
// ---------------------------------------------------------------------------
// Overlays live in their own panes outside the tile pane, so the desktop CSS filter that
// darkens OSM tiles never recolours radar / satellite / model images.

let radarFrameLayers = new Map(); // RainViewer frame path -> L.tileLayer
let gridOverlay = null;
let gridOverlayKey = null;
let satLayer = null;
let layerControl = null;
let gridFetchKey = null;
const layerToggleInputs = [];
const timelineState = { frames: [], index: -1, nowIndex: -1, playing: false, timer: null, loops: 0, trimTimer: null };

function ensureMapPanes() {
  if (!mapInstance || typeof mapInstance.createPane !== 'function') return false;
  // India layers: isobars + wind arrows above radar, cyclone zones above them, labels above
  // the route (overlayPane 400) but under the pins / cyclone markers (markerPane 600).
  [['rsSat', 250], ['rsGrid', 340], ['rsRadar', 350], ['rsIsobar', 355], ['rsWind', 360], ['rsCyclone', 370], ['rsMapLabel', 450]].forEach(([name, z]) => {
    if (mapInstance.getPane(name)) return;
    const pane = mapInstance.createPane(name);
    pane.style.zIndex = String(z);
    pane.style.pointerEvents = 'none';
  });
  return true;
}

function removeMapLayer(layer) {
  if (mapInstance && layer && mapInstance.hasLayer(layer)) mapInstance.removeLayer(layer);
}

function addMapLayer(layer) {
  if (mapInstance && layer && !mapInstance.hasLayer(layer)) layer.addTo(mapInstance);
}

// OSM base map on phones and desktop, darkened by the CSS filter on the tile pane.
// (CARTO's dark tiles were tried for phones but now require an API key.)
function setBaseLayer(mobile) {
  if (!mapInstance || typeof L === 'undefined') return;
  addMapLayer(osmBaseLayer);
}

// One tile layer per radar frame, created lazily (opacity 0 = preloaded but hidden).
function radarLayerFor(path) {
  if (radarFrameLayers.has(path)) return radarFrameLayers.get(path);
  const meta = appState.radarMeta;
  if (!mapInstance || !meta || typeof L === 'undefined') return null;
  const layer = L.tileLayer(`${meta.host}${path}/256/{z}/{x}/{y}/2/1_1.png`, {
    pane: 'rsRadar',
    opacity: 0,
    maxNativeZoom: 7, // RainViewer serves z <= 7 only
    maxZoom: 19,
    updateWhenZooming: false,
    keepBuffer: isMobileMap() ? 0 : 2,
    attribution: RADAR_ATTRIBUTION
  });
  radarFrameLayers.set(path, layer);
  if (appState.layers.radar) layer.addTo(mapInstance);
  return layer;
}

function ensureAllFrameLayers() {
  timelineState.frames.forEach(f => { if (f.kind === 'radar') radarLayerFor(f.path); });
}

function gridBounds(grid) {
  const half = (grid.n - 1) / 2 * grid.step + grid.step / 2; // cell centres ± half a cell
  return [[grid.lat0 - half, grid.lon0 - half], [grid.lat0 + half, grid.lon0 + half]];
}

function showGridHour(hourIdx) {
  const grid = appState.grid;
  const url = grid && grid.dataUrls ? grid.dataUrls[hourIdx] : null;
  if (!url || !mapInstance || typeof L === 'undefined') { hideGridOverlay(); return; }
  if (!gridOverlay || gridOverlayKey !== grid.key) {
    removeMapLayer(gridOverlay);
    gridOverlay = L.imageOverlay(url, gridBounds(grid), {
      pane: 'rsGrid',
      opacity: 0.6,
      interactive: false,
      attribution: 'Model: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>'
    });
    gridOverlayKey = grid.key;
  } else {
    gridOverlay.setUrl(url);
  }
  addMapLayer(gridOverlay);
}

function hideGridOverlay() {
  removeMapLayer(gridOverlay);
}

// ---------------------------------------------------------------------------
// Timeline control (play / scrub) — shared by the phone sheet and the desktop map
// ---------------------------------------------------------------------------

function buildTimelineControl() {
  const existing = document.getElementById('rsTimeline');
  if (existing) return existing;
  const root = document.createElement('div');
  root.id = 'rsTimeline';
  root.className = 'rs-timeline rs-empty';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Rain map timeline');

  const play = document.createElement('button');
  play.id = 'rsPlay';
  play.type = 'button';
  play.className = 'rs-play';
  play.textContent = '▶';
  play.setAttribute('aria-label', 'Play rain map loop');

  const slider = document.createElement('input');
  slider.id = 'rsSlider';
  slider.type = 'range';
  slider.className = 'rs-slider';
  slider.min = '0';
  slider.max = '0';
  slider.step = '1';
  slider.value = '0';
  slider.setAttribute('aria-label', 'Rain map time');

  const label = document.createElement('span');
  label.id = 'rsTimeLabel';
  label.className = 'rs-time-label';

  const tag = document.createElement('span');
  tag.id = 'rsSourceTag';
  tag.className = 'rs-source-tag';

  const legend = document.createElement('div');
  legend.id = 'rsLegend';
  legend.className = 'rs-legend';
  const bar = document.createElement('span');
  bar.className = 'rs-legend-bar';
  bar.style.background = rainLegendGradient();
  const legendText = document.createElement('span');
  legendText.id = 'rsLegendText';
  legendText.className = 'rs-legend-text';
  legendText.textContent = 'No rain map data';
  legend.appendChild(bar);
  legend.appendChild(legendText);

  [play, slider, label, tag, legend].forEach(child => root.appendChild(child));

  play.addEventListener('click', () => toggleTimelinePlay());
  slider.addEventListener('input', () => {
    stopTimeline();
    ensureAllFrameLayers();
    showFrame(Number(slider.value));
  });
  return root;
}

function renderTimelineLabel(f) {
  const root = document.getElementById('rsTimeline');
  if (!root) return;
  const slider = document.getElementById('rsSlider');
  const label = document.getElementById('rsTimeLabel');
  const tag = document.getElementById('rsSourceTag');
  const legendText = document.getElementById('rsLegendText');
  const n = timelineState.frames.length;
  root.classList.toggle('rs-empty', !f);
  if (slider) {
    slider.max = String(Math.max(0, n - 1));
    slider.value = String(Math.max(0, timelineState.index));
    slider.disabled = n < 2;
  }
  if (!f) {
    if (label) label.textContent = '';
    if (tag) tag.textContent = '';
    if (legendText) legendText.textContent = 'No rain map data';
    return;
  }
  const text = `${f.label} · ${f.rel}`;
  if (label) label.textContent = text;
  if (slider) slider.setAttribute('aria-valuetext', `${text} ${f.kind === 'radar' ? 'radar' : 'forecast model'}`);
  if (tag) {
    tag.className = `rs-source-tag ${f.kind === 'radar' ? 'is-radar' : 'is-model'}`;
    tag.textContent = f.kind === 'radar'
      ? (appState.gridFailed && appState.layers.grid ? 'RADAR · Forecast map unavailable' : 'RADAR')
      : (indiaLayersOn() && isIndiaZoom() ? 'MODEL · wind & pressure · 2° grid' : 'FORECAST MODEL · ~10–25 km, not radar');
  }
  if (legendText) legendText.textContent = 'Light · Mod · Heavy · Extreme (approx.)';
}

function showFrame(i) {
  const frames = timelineState.frames;
  if (!frames.length) {
    timelineState.index = -1;
    radarFrameLayers.forEach(layer => layer.setOpacity(0));
    hideGridOverlay();
    renderTimelineLabel(null);
    renderIndiaLayers(null);
    return;
  }
  const idx = Math.max(0, Math.min(frames.length - 1, Number.isFinite(i) ? i : timelineState.nowIndex));
  timelineState.index = idx;
  const f = frames[idx];
  if (f.kind === 'radar') radarLayerFor(f.path);
  radarFrameLayers.forEach((layer, path) => layer.setOpacity(f.kind === 'radar' && path === f.path ? RADAR_OPACITY : 0));
  // The local 7 × 7 rain grid covers ~90 km: only drawn when zoomed in (or zoom unknown).
  const z = mapZoom();
  if (f.kind === 'model' && f.src !== 'india' && (z === null || z >= LOCAL_GRID_MIN_ZOOM)) showGridHour(f.hourIdx);
  else hideGridOverlay();
  renderIndiaLayers(f);
  renderTimelineLabel(f);
}

// Rebuild frames after new radar/grid data or a layer toggle. Stays on the same frame
// unless the user was on "now", in which case it follows the new "now".
function rebuildTimeline() {
  if (!mapInstance) return;
  const prev = timelineState.frames[timelineState.index];
  const wasAtNow = timelineState.index === -1 || timelineState.index === timelineState.nowIndex;
  const o = appState.originCoords || DEFAULT_COORDS;
  const gridOk = appState.grid && appState.grid.dataUrls && appState.grid.dataUrls.length
    && appState.grid.key === gridKeyFor(buildGridPoints(o.lat, o.lon)); // never show another area's grid
  const grid = gridOk ? appState.grid : null;
  // Model hours: the local rain grid when on + loaded, else the India field's hours
  // (India layers on, field usable, India zoom).
  let modelSrc = appState.layers.grid ? grid : null;
  const field = appState.india && appState.india.field;
  if (!modelSrc && indiaLayersOn() && indiaFieldUsable(field) && isIndiaZoom()) modelSrc = { times: field.times, src: 'india' };
  const { frames, defaultIndex } = buildTimelineFrames(
    appState.layers.radar ? appState.radarMeta : null,
    modelSrc,
    Date.now() / 1000
  );
  timelineState.frames = frames;
  timelineState.nowIndex = defaultIndex;

  // Frames that left the 2-h window: drop their tile layers.
  const keep = new Set(frames.filter(f => f.kind === 'radar').map(f => f.path));
  radarFrameLayers.forEach((layer, path) => {
    if (!keep.has(path)) { removeMapLayer(layer); radarFrameLayers.delete(path); }
  });

  let idx = defaultIndex;
  if (!wasAtNow && prev) {
    const same = frames.findIndex(f => f.kind === prev.kind && f.t === prev.t);
    if (same !== -1) idx = same;
  }
  if (timelineState.playing && frames.length < 2) stopTimeline();
  showFrame(idx);
  // Hidden frame layers still reload tiles on every pan/zoom: when idle keep only the
  // frame on screen (playback recreates the others lazily).
  if (!timelineState.playing) trimRadarLayers();
}

function syncRadarFrames() {
  if (!mapInstance) return;
  rebuildTimeline();
}

function setPlayButton(playing) {
  const btn = document.getElementById('rsPlay');
  if (!btn) return;
  btn.textContent = playing ? '❚❚' : '▶';
  btn.setAttribute('aria-label', playing ? 'Pause rain map loop' : 'Play rain map loop');
  btn.classList.toggle('is-playing', playing);
}

function stopTimeline() {
  clearTimeout(timelineState.timer);
  timelineState.timer = null;
  if (timelineState.playing) {
    timelineState.playing = false;
    setPlayButton(false);
  }
  scheduleRadarTrim();
}

function toggleTimelinePlay(force) {
  const play = force !== undefined ? !!force : !timelineState.playing;
  if (!play) { stopTimeline(); return; }
  if (timelineState.frames.length < 2) return;
  ensureAllFrameLayers();
  clearTimeout(timelineState.trimTimer);
  timelineState.playing = true;
  timelineState.loops = 0;
  setPlayButton(true);
  if (timelineState.index >= timelineState.frames.length - 1) showFrame(0);
  scheduleNextFrame();
}

// 450 ms per radar frame, 800 ms per model hour, 1.5 s hold on "now" and the last frame.
function scheduleNextFrame() {
  const f = timelineState.frames[timelineState.index];
  if (!timelineState.playing || !f) return;
  const hold = timelineState.index === timelineState.nowIndex || timelineState.index === timelineState.frames.length - 1;
  const delay = hold ? 1500 : f.kind === 'model' ? 800 : 450;
  timelineState.timer = setTimeout(advanceTimeline, delay);
}

function advanceTimeline() {
  if (!timelineState.playing) return;
  let next = timelineState.index + 1;
  if (next >= timelineState.frames.length) {
    next = 0;
    timelineState.loops++;
    if (timelineState.loops >= 3) { stopTimeline(); return; } // auto-stop after 3 loops
  }
  // Wait (max 1.2 s) for the next radar frame's tiles so the loop doesn't flash blank.
  const f = timelineState.frames[next];
  const layer = f && f.kind === 'radar' ? radarLayerFor(f.path) : null;
  const started = Date.now();
  const go = () => {
    if (!timelineState.playing) return;
    if (layer && layer.isLoading() && Date.now() - started < 1200) {
      timelineState.timer = setTimeout(go, 100);
      return;
    }
    showFrame(next);
    scheduleNextFrame();
  };
  go();
}

// Phones: after 60 s idle keep only the frame on screen (frees tile memory).
function scheduleRadarTrim() {
  clearTimeout(timelineState.trimTimer);
  timelineState.trimTimer = setTimeout(trimRadarLayers, isMobileMap() ? 60000 : 300000);
}

function trimRadarLayers() {
  if (timelineState.playing) return;
  const cur = timelineState.frames[timelineState.index];
  radarFrameLayers.forEach((layer, path) => {
    if (cur && cur.kind === 'radar' && cur.path === path) return;
    removeMapLayer(layer);
    radarFrameLayers.delete(path);
  });
}

// ---------------------------------------------------------------------------
// Experimental forecast grid (Open-Meteo, 49 points)
// ---------------------------------------------------------------------------

async function fetchForecastGrid(lat, lon) {
  const spec = buildGridPoints(lat, lon);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${spec.points.map(p => p.lat).join(',')}&longitude=${spec.points.map(p => p.lon).join(',')}&hourly=precipitation,precipitation_probability&forecast_hours=7&timeformat=unixtime`;
  const res = await fetchWithTimeout(url, {}, 9000);
  if (!res.ok) throw new Error('grid API ' + res.status);
  const grid = parseGridResponse(await res.json(), spec);
  grid.key = gridKeyFor(spec);
  return grid;
}

function gridKeyFor(spec) {
  return `${spec.lat0.toFixed(2)},${spec.lon0.toFixed(2)}`;
}

// Hourly 7 × 7 colour images, upscaled with smoothing → data: URLs for one imageOverlay.
function renderGridImages(grid) {
  grid.dataUrls = [];
  if (typeof document.createElement !== 'function') return;
  try {
    const src = document.createElement('canvas');
    src.width = grid.n;
    src.height = grid.n;
    const sctx = src.getContext && src.getContext('2d');
    if (!sctx || typeof sctx.createImageData !== 'function') return;
    const out = document.createElement('canvas');
    out.width = 56;
    out.height = 56;
    const octx = out.getContext('2d');
    grid.precip.forEach((cells, h) => {
      const img = sctx.createImageData(grid.n, grid.n);
      cells.forEach((mm, i) => {
        const [r, g, b, a] = rainColor(mm);
        img.data[i * 4] = r;
        img.data[i * 4 + 1] = g;
        img.data[i * 4 + 2] = b;
        img.data[i * 4 + 3] = Math.round(a * 255);
      });
      sctx.putImageData(img, 0, 0);
      octx.clearRect(0, 0, 56, 56);
      octx.imageSmoothingEnabled = true;
      octx.drawImage(src, 0, 0, 56, 56);
      const url = out.toDataURL('image/png');
      if (typeof url === 'string' && url.startsWith('data:')) grid.dataUrls[h] = url;
    });
  } catch (e) {
    console.warn('Forecast grid render failed:', e);
    grid.dataUrls = [];
  }
}

function useGrid(grid) {
  appState.grid = grid;
  renderGridImages(grid);
  rebuildTimeline();
}

// Live only, map present and the forecast layer on. 30-min TTL; a localStorage copy
// (< 45 min, same snapped centre) is reused across reloads.
async function refreshForecastGrid() {
  if (appState.activeScenario !== 'live' || !mapInstance || !appState.layers.grid) return;
  const o = appState.originCoords || DEFAULT_COORDS;
  const spec = buildGridPoints(o.lat, o.lon);
  const key = gridKeyFor(spec);
  const now = Date.now();
  const g = appState.grid;
  if (g && g.key === key && now - g.fetchedAt < GRID_TTL_MS) return;
  if (gridFetchKey === key) return; // already in flight
  // Back off after a failure (longer when rate-limited) instead of retrying every heartbeat.
  const fail = appState.gridFailure;
  if (fail && fail.key === key && now - fail.at < (fail.rateLimited ? 30 : 10) * 60000) return;

  try {
    const c = JSON.parse(localStorage.getItem(GRID_CACHE_KEY) || 'null');
    if (c && c.key === key && c.grid && now - c.fetchedAt < GRID_CACHE_MAX_MS && (!g || g.key !== key)) {
      // Hours that have passed since the cache was written are dropped by the timeline.
      useGrid({ ...c.grid, key, fetchedAt: c.fetchedAt });
      if (now - c.fetchedAt < GRID_TTL_MS) return;
    }
  } catch (e) { /* corrupt cache: refetch */ }

  gridFetchKey = key;
  try {
    const grid = await fetchForecastGrid(o.lat, o.lon);
    const cur = appState.originCoords || DEFAULT_COORDS;
    if (gridKeyFor(buildGridPoints(cur.lat, cur.lon)) !== key) return; // user moved meanwhile
    appState.gridFailed = false;
    appState.gridFailure = null;
    try {
      const { lat0, lon0, step, n, times, precip, prob, fetchedAt } = grid;
      localStorage.setItem(GRID_CACHE_KEY, JSON.stringify({ key, fetchedAt, grid: { lat0, lon0, step, n, times, precip, prob } }));
    } catch (e) { /* quota / private mode: cache is optional */ }
    useGrid(grid);
  } catch (e) {
    console.warn('Forecast grid fetch failed:', e);
    appState.gridFailure = { key, at: Date.now(), rateLimited: /\b429\b/.test(String(e && e.message)) };
    if (!appState.grid || appState.grid.key !== key) appState.gridFailed = true;
    rebuildTimeline();
  } finally {
    if (gridFetchKey === key) gridFetchKey = null;
  }
}

// ---------------------------------------------------------------------------
// Layer toggles (radar / forecast / satellite / route) — mobile panel + desktop control
// ---------------------------------------------------------------------------

const LAYER_DEFS = [
  { key: 'radar', title: 'Radar', sub: 'RainViewer · past 2 h' },
  { key: 'grid', title: 'Forecast rain', sub: 'Experimental · model, next 6 h' },
  { key: 'satellite', title: 'Satellite clouds', sub: 'IR clouds, ~1–2 h delay' },
  { key: 'wind', title: 'Wind', sub: 'Model · India 2° grid · next 6 h' },
  { key: 'pressure', title: 'Pressure & lows', sub: 'Isobars 2 hPa · model, not IMD' },
  { key: 'cyclones', title: 'Cyclones', sub: 'GDACS · active storms' },
  { key: 'route', title: 'Trip route', sub: 'A/B pins and path' }
];

function buildLayerToggles(container) {
  if (!container) return;
  LAYER_DEFS.forEach(def => {
    const row = document.createElement('label');
    row.className = 'rs-layer-row';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = !!appState.layers[def.key];
    box.setAttribute('data-layer', def.key);
    const text = document.createElement('span');
    text.className = 'rs-layer-text';
    const title = document.createElement('span');
    title.className = 'rs-layer-title';
    title.textContent = def.title;
    const sub = document.createElement('span');
    sub.className = 'rs-layer-sub';
    sub.textContent = def.sub;
    text.appendChild(title);
    text.appendChild(sub);
    row.appendChild(box);
    row.appendChild(text);
    container.appendChild(row);
    box.addEventListener('change', () => setMapLayer(def.key, box.checked));
    layerToggleInputs.push({ key: def.key, box, sub, def });
  });
}

function setMapLayer(key, on) {
  appState.layers[key] = !!on;
  try { localStorage.setItem(LAYERS_KEY, JSON.stringify(appState.layers)); } catch (e) { /* optional */ }
  layerToggleInputs.forEach(t => { t.box.checked = !!appState.layers[t.key]; });
  // Wind / pressure only draw at India zoom: switching one on while zoomed in shows India.
  const z = mapZoom();
  if ((key === 'wind' || key === 'pressure') && on && z !== null && z > INDIA_MAX_ZOOM) showIndiaView();
  applyLayers();
}

function applyLayers() {
  if (!mapInstance || typeof L === 'undefined') return;
  const on = appState.layers;
  if (on.satellite) {
    if (!satLayer) {
      satLayer = L.tileLayer(GIBS_IR_TILES, {
        pane: 'rsSat',
        opacity: 0.45,
        maxNativeZoom: 6,
        maxZoom: 19,
        attribution: 'Satellite: <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener">NASA GIBS</a> / JMA Himawari'
      });
    }
    addMapLayer(satLayer);
  } else {
    removeMapLayer(satLayer);
  }
  radarFrameLayers.forEach(layer => (on.radar ? addMapLayer(layer) : removeMapLayer(layer)));
  [routeLineLayer, originMarker, destMarker].forEach(layer => (on.route ? addMapLayer(layer) : removeMapLayer(layer)));
  if (on.grid) refreshForecastGrid();
  refreshIndiaField().catch(err => console.warn('India model refresh failed:', err));
  refreshCyclones().catch(err => console.warn('Cyclone refresh failed:', err));
  rebuildTimeline();
  renderCycloneLayers();
  updateLayerStatus();
}

function addDesktopLayerControl() {
  if (layerControl || !mapInstance || typeof L.control !== 'function') return;
  // top-left: the desktop map's top-right corner holds the Recenter button
  layerControl = L.control({ position: 'topleft' });
  layerControl.onAdd = () => {
    const div = L.DomUtil.create('div', 'rs-layer-control');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rs-layer-btn';
    btn.textContent = 'Layers';
    btn.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('div');
    panel.className = 'rs-layer-panel';
    panel.hidden = true;
    buildLayerToggles(panel);
    btn.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      btn.setAttribute('aria-expanded', String(!panel.hidden));
    });
    const indiaBtn = document.createElement('button');
    indiaBtn.type = 'button';
    indiaBtn.className = 'rs-layer-btn rs-india-btn';
    indiaBtn.textContent = 'India';
    indiaBtn.setAttribute('aria-label', 'Show all India');
    indiaBtn.title = 'All India';
    indiaBtn.addEventListener('click', () => showIndiaView());
    div.appendChild(btn);
    div.appendChild(indiaBtn);
    div.appendChild(panel);
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    return div;
  };
  layerControl.addTo(mapInstance);
}

// ============================================================================
// 8.65 INDIA MODEL LAYERS: 10-m WIND ARROWS, MSL ISOBARS, MODEL LOW/HIGH CENTRES
// ============================================================================
// One Open-Meteo multi-point request: 17 × 17 = 289 points at 2° over 6–38°N, 66–98°E,
// hourly 10-m wind + mean-sea-level pressure for the next 8 h. Coarse global-model output:
// "L" centres are model pressure minima, NOT IMD lows/depressions, and are labelled so.
// Drawn as Leaflet SVG vectors (one <path> per wind-speed bin / pressure level), never
// animated. Only at India zoom (≤ 7); the local 7 × 7 rain grid only at zoom ≥ 7.

const INDIA_LAT_N = 38;
const INDIA_LAT_S = 6;
const INDIA_LON_W = 66;
const INDIA_LON_E = 98;
const INDIA_STEP = 2;
const INDIA_HOURS = 8;
const INDIA_TTL_MS = 60 * 60000;
const INDIA_CACHE_MAX_MS = 90 * 60000;
const INDIA_CACHE_KEY = 'rainstop_india_v1';
const INDIA_MAX_ZOOM = 7;
const LOCAL_GRID_MIN_ZOOM = 7;
const INDIA_BOUNDS = [[6.5, 68], [35.5, 97.5]];
// Wind-speed bins (km/h, lower bound → colour). 31 / 50 / 62 / 89 km/h are the IMD
// depression / deep depression / cyclonic storm / severe cyclonic storm thresholds.
const WIND_BINS = [
  { min: 0, color: '#9ca3af' },
  { min: 10, color: '#67e8f9' },
  { min: 20, color: '#34d399' },
  { min: 31, color: '#facc15' },
  { min: 50, color: '#fb923c' },
  { min: 62, color: '#ef4444' },
  { min: 89, color: '#d946ef' }
];

let indiaSpecMemo = null;
let indiaFetching = false;
let indiaWindGroup = null;
let indiaIsoGroup = null;
let indiaLabelGroup = null;
let indiaRenderKey = '';
let indiaLegendEl = null;
let indiaZoomBucket = null;
let localGridZoomOn = null;

// 17 × 17 lattice. Rows run north → south, columns west → east (integer degrees).
function buildIndiaGridSpec() {
  const nr = Math.round((INDIA_LAT_N - INDIA_LAT_S) / INDIA_STEP) + 1;
  const nc = Math.round((INDIA_LON_E - INDIA_LON_W) / INDIA_STEP) + 1;
  const points = [];
  for (let row = 0; row < nr; row++) {
    for (let col = 0; col < nc; col++) {
      points.push({ lat: INDIA_LAT_N - row * INDIA_STEP, lon: INDIA_LON_W + col * INDIA_STEP, row, col });
    }
  }
  return { latN: INDIA_LAT_N, lonW: INDIA_LON_W, step: INDIA_STEP, nr, nc, points };
}

function indiaSpec() {
  if (!indiaSpecMemo) indiaSpecMemo = buildIndiaGridSpec();
  return indiaSpecMemo;
}

function indiaGridUrl(spec) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${spec.points.map(p => p.lat).join(',')}&longitude=${spec.points.map(p => p.lon).join(',')}&hourly=wind_speed_10m,wind_direction_10m,pressure_msl&forecast_hours=${INDIA_HOURS}&timeformat=unixtime`;
}

// Multi-point response → { times[h], ws[h][i] km/h, wd[h][i] deg FROM, p[h][i] hPa, elev[i] m }.
// i = row * nc + col. Missing values → NaN.
function parseIndiaField(json, spec) {
  if (!Array.isArray(json)) throw new Error('India grid: response is not an array');
  if (!spec || !Array.isArray(spec.points) || json.length !== spec.points.length) {
    throw new Error(`India grid: expected ${spec && spec.points ? spec.points.length : '?'} points, got ${json.length}`);
  }
  const first = json[0] && json[0].hourly;
  if (!first || !Array.isArray(first.time) || !first.time.length) throw new Error('India grid: no time axis');
  const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? NaN : Number(v);
  const times = first.time.map(Number);
  const series = key => times.map((_, h) => json.map(pt => {
    const arr = pt && pt.hourly && pt.hourly[key];
    return num(Array.isArray(arr) ? arr[h] : null);
  }));
  return {
    times,
    ws: series('wind_speed_10m'),
    wd: series('wind_direction_10m'),
    p: series('pressure_msl'),
    elev: json.map(pt => num(pt && pt.elevation)),
    fetchedAt: Date.now()
  };
}

// Nearest model hour to tSec (within 90 min), else -1.
function indiaHourIndex(field, tSec) {
  if (!field || !Array.isArray(field.times)) return -1;
  let best = -1, bestD = Infinity;
  field.times.forEach((t, i) => {
    const d = Math.abs(t - tSec);
    if (d < bestD) { bestD = d; best = i; }
  });
  return bestD <= 5400 ? best : -1;
}

function indiaFieldUsable(field) {
  return !!field && Array.isArray(field.times) && indiaHourIndex(field, Date.now() / 1000) !== -1;
}

// NaN-aware 1-2-1 × 1-2-1 smoothing (NaN cells stay NaN).
function smoothField(v, nr, nc) {
  const out = new Array(nr * nc);
  const w = d => (d === 0 ? 2 : 1);
  for (let r = 0; r < nr; r++) {
    for (let c = 0; c < nc; c++) {
      if (!Number.isFinite(v[r * nc + c])) { out[r * nc + c] = NaN; continue; }
      let s = 0, ws = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= nr || cc >= nc) continue;
          const x = v[rr * nc + cc];
          if (!Number.isFinite(x)) continue;
          const k = w(dr) * w(dc);
          s += k * x; ws += k;
        }
      }
      out[r * nc + c] = s / ws;
    }
  }
  return out;
}

// Bilinear upsample by an integer factor f → { v, nr: (nr−1)f+1, nc: (nc−1)f+1 }.
// A sample touching a NaN node is NaN.
function upsampleBilinear(v, nr, nc, f) {
  const NR = (nr - 1) * f + 1, NC = (nc - 1) * f + 1;
  const out = new Array(NR * NC);
  for (let R = 0; R < NR; R++) {
    const r0 = Math.min(nr - 2, Math.floor(R / f)), fr = R / f - r0;
    for (let C = 0; C < NC; C++) {
      const c0 = Math.min(nc - 2, Math.floor(C / f)), fc = C / f - c0;
      const a = v[r0 * nc + c0], b = v[r0 * nc + c0 + 1], c = v[(r0 + 1) * nc + c0], d = v[(r0 + 1) * nc + c0 + 1];
      out[R * NC + C] = a * (1 - fr) * (1 - fc) + b * (1 - fr) * fc + c * fr * (1 - fc) + d * fr * fc;
    }
  }
  return { v: out, nr: NR, nc: NC };
}

// Contour segments of `level` over a row-major grid, in [row, col] float coordinates.
// Corners strictly above the level count as "in". Edge crossings are interpolated in a
// fixed node order so neighbouring cells produce bit-identical shared points. Saddles are
// resolved by the cell-centre mean; cells touching a NaN are skipped.
function marchingSquares(v, nr, nc, level) {
  const segs = [];
  const cross = (r1, c1, r2, c2) => {
    const a = v[r1 * nc + c1], b = v[r2 * nc + c2];
    const t = b === a ? 0.5 : Math.max(0, Math.min(1, (level - a) / (b - a)));
    return [r1 + (r2 - r1) * t, c1 + (c2 - c1) * t];
  };
  for (let r = 0; r < nr - 1; r++) {
    for (let c = 0; c < nc - 1; c++) {
      const tl = v[r * nc + c], tr = v[r * nc + c + 1], br = v[(r + 1) * nc + c + 1], bl = v[(r + 1) * nc + c];
      if (!Number.isFinite(tl) || !Number.isFinite(tr) || !Number.isFinite(br) || !Number.isFinite(bl)) continue;
      const idx = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const T = () => cross(r, c, r, c + 1);         // top edge
      const Rt = () => cross(r, c + 1, r + 1, c + 1); // right edge
      const B = () => cross(r + 1, c, r + 1, c + 1); // bottom edge
      const Lf = () => cross(r, c, r + 1, c);         // left edge
      const centreIn = (tl + tr + br + bl) / 4 > level;
      switch (idx) {
        case 1: case 14: segs.push([Lf(), B()]); break;
        case 2: case 13: segs.push([B(), Rt()]); break;
        case 3: case 12: segs.push([Lf(), Rt()]); break;
        case 4: case 11: segs.push([T(), Rt()]); break;
        case 6: case 9: segs.push([T(), B()]); break;
        case 7: case 8: segs.push([Lf(), T()]); break;
        case 5: // tr + bl in
          if (centreIn) { segs.push([Lf(), T()]); segs.push([B(), Rt()]); }
          else { segs.push([T(), Rt()]); segs.push([Lf(), B()]); }
          break;
        case 10: // tl + br in
          if (centreIn) { segs.push([T(), Rt()]); segs.push([Lf(), B()]); }
          else { segs.push([Lf(), T()]); segs.push([B(), Rt()]); }
          break;
        default: break;
      }
    }
  }
  return segs;
}

// Chain segments into polylines by shared endpoints → [{ pts, closed }].
function joinSegments(segs) {
  const key = p => `${Math.round(p[0] * 1e6)},${Math.round(p[1] * 1e6)}`;
  const list = (segs || []).filter(s => key(s[0]) !== key(s[1])); // drop zero-length pieces
  const byKey = new Map();
  list.forEach((s, i) => {
    [0, 1].forEach(end => {
      const k = key(s[end]);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(i);
    });
  });
  const used = new Array(list.length).fill(false);
  const takeNext = (k) => {
    const cands = byKey.get(k) || [];
    for (const i of cands) {
      if (used[i]) continue;
      used[i] = true;
      const s = list[i];
      return key(s[0]) === k ? s[1] : s[0];
    }
    return null;
  };
  const chains = [];
  for (let i = 0; i < list.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const pts = [list[i][0], list[i][1]];
    let nxt;
    while ((nxt = takeNext(key(pts[pts.length - 1]))) !== null) pts.push(nxt);
    while ((nxt = takeNext(key(pts[0]))) !== null) pts.unshift(nxt);
    const closed = pts.length > 3 && key(pts[0]) === key(pts[pts.length - 1]);
    chains.push({ pts, closed });
  }
  return chains;
}

// Grid coordinate (row, col) of a field upsampled by f → [lat, lon].
function gridToLatLon(r, c, spec, f = 1) {
  return [+(spec.latN - (r / f) * spec.step).toFixed(4), +(spec.lonW + (c / f) * spec.step).toFixed(4)];
}

// Isobars every 2 hPa (major every 4) on the smoothed field upsampled ×4.
// → [{ level, major, lines: [[[lat, lon], …]], labelAt: [lat, lon] | null }]
function buildIsobars(pRow, spec) {
  if (!Array.isArray(pRow) || pRow.length !== spec.nr * spec.nc) return [];
  const f = 4;
  const up = upsampleBilinear(smoothField(pRow, spec.nr, spec.nc), spec.nr, spec.nc, f);
  const finite = up.v.filter(Number.isFinite);
  if (!finite.length) return [];
  const lo = Math.ceil(Math.min(...finite) / 2) * 2;
  const hi = Math.floor(Math.max(...finite) / 2) * 2;
  const out = [];
  let labels = 0;
  for (let level = lo; level <= hi; level += 2) {
    const chains = joinSegments(marchingSquares(up.v, up.nr, up.nc, level));
    if (!chains.length) continue;
    const lines = chains.map(ch => ch.pts.map(p => gridToLatLon(p[0], p[1], spec, f)));
    let labelAt = null;
    const longest = chains.reduce((a, b) => (b.pts.length > a.pts.length ? b : a), chains[0]);
    if (longest.pts.length >= 8 && labels < 16) {
      const mid = longest.pts[Math.floor(longest.pts.length / 2)];
      labelAt = gridToLatLon(mid[0], mid[1], spec, f);
      labels++;
    }
    out.push({ level, major: level % 4 === 0, lines, labelAt });
  }
  return out;
}

// Model pressure minima (L) / maxima (H) on the smoothed field upsampled ×2: strict
// 8-neighbour extreme, ≥ 2 cells from the edge, ≥ 1 hPa deeper than the ring 2 cells out,
// not over high terrain (MSL pressure is extrapolated there), merged within 3°, ≤ 4 each.
function findPressureCentres(pRow, spec, elev) {
  if (!Array.isArray(pRow) || pRow.length !== spec.nr * spec.nc) return [];
  const f = 2;
  const up = upsampleBilinear(smoothField(pRow, spec.nr, spec.nc), spec.nr, spec.nc, f);
  const { v, nr, nc } = up;
  const at = (r, c) => v[r * nc + c];
  const cands = [];
  for (let r = 2; r <= nr - 3; r++) {
    for (let c = 2; c <= nc - 3; c++) {
      const x = at(r, c);
      if (!Number.isFinite(x)) continue;
      let isMin = true, isMax = true, ok = true;
      for (let dr = -1; dr <= 1 && ok; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const y = at(r + dr, c + dc);
          if (!Number.isFinite(y)) { ok = false; break; }
          if (!(x < y)) isMin = false;
          if (!(x > y)) isMax = false;
        }
      }
      if (!ok || (!isMin && !isMax)) continue;
      let ringMin = Infinity, ringMax = -Infinity;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== 2) continue;
          const y = at(r + dr, c + dc);
          if (!Number.isFinite(y)) continue;
          ringMin = Math.min(ringMin, y);
          ringMax = Math.max(ringMax, y);
        }
      }
      const depth = isMin ? ringMin - x : x - ringMax;
      if (!(depth >= 0.75)) continue; // closed by ≥0.75 hPa within ~2°: catches typical monsoon lows
      const rawR = Math.round(r / f), rawC = Math.round(c / f);
      const e = Array.isArray(elev) ? elev[rawR * spec.nc + rawC] : NaN;
      if (Number.isFinite(e) && e > 1000) continue;
      const [lat, lon] = gridToLatLon(r, c, spec, f);
      cands.push({ kind: isMin ? 'L' : 'H', lat, lon, hPa: +x.toFixed(1), depth: +depth.toFixed(2) });
    }
  }
  cands.sort((a, b) => b.depth - a.depth);
  const kept = [];
  cands.forEach(cand => {
    const same = kept.filter(k => k.kind === cand.kind);
    if (same.length >= 4) return;
    if (same.some(k => Math.hypot(k.lat - cand.lat, k.lon - cand.lon) < 3)) return;
    kept.push(cand);
  });
  return kept;
}

// Strongest model wind (km/h) within `km` of a point for hour h, or null.
function maxWindNear(field, h, lat, lon, km = 300) {
  if (!field || !Array.isArray(field.ws) || !Array.isArray(field.ws[h])) return null;
  const pts = indiaSpec().points;
  let best = null;
  field.ws[h].forEach((w, i) => {
    if (!Number.isFinite(w) || !pts[i]) return;
    if (haversineDistance(lat, lon, pts[i].lat, pts[i].lon) > km) return;
    if (best === null || w > best) best = w;
  });
  return best;
}

// Wind strength around a model low, in IMD-threshold words. Never claims a cyclone:
// stops at "cyclonic-storm-strength winds" and always says it is a model estimate.
function classifyLow(maxKmh) {
  const tail = ' · model est., not IMD';
  const v = Number(maxKmh);
  if (Number.isFinite(v) && v >= 62) return { cls: 'cs', label: `Cyclonic-storm-strength winds${tail}` };
  if (Number.isFinite(v) && v >= 50) return { cls: 'deep', label: `Deep-depression-strength winds${tail}` };
  if (Number.isFinite(v) && v >= 31) return { cls: 'depression', label: `Depression-strength winds${tail}` };
  return { cls: 'low', label: `Low${tail}` };
}

// Degree offsets for an arrow of lenPx screen pixels pointing DOWNWIND (wind blows FROM
// fromDeg) at web-Mercator zoom z and latitude lat: equal pixel length at any latitude.
function windArrowVector(fromDeg, lenPx, zoom, lat) {
  const b = (((Number(fromDeg) + 180) % 360) + 360) % 360 * Math.PI / 180;
  const k = 256 * Math.pow(2, zoom) / 360; // px per degree of longitude
  return { dLat: Math.cos(b) * lenPx * Math.cos(lat * Math.PI / 180) / k, dLon: Math.sin(b) * lenPx / k };
}

function windBin(kmh) {
  const v = Number(kmh);
  if (!Number.isFinite(v)) return -1;
  let i = 0;
  while (i + 1 < WIND_BINS.length && v >= WIND_BINS[i + 1].min) i++;
  return i;
}

// Arrow polylines grouped by speed bin → [{ bin, color, lines }] (one Leaflet path per bin).
// Fixed screen length (recomputed on zoom), shaft centred on the grid point, two head barbs.
function windArrowSegments(field, h, zoom, spec) {
  if (!field || !Array.isArray(field.ws) || !Array.isArray(field.ws[h]) || !Number.isFinite(zoom)) return [];
  const k = 256 * Math.pow(2, zoom) / 360;
  const L = Math.max(10, Math.min(26, 0.55 * spec.step * k));
  const stride = zoom <= 3 ? 2 : 1;
  const bins = WIND_BINS.map((b, i) => ({ bin: i, color: b.color, lines: [] }));
  spec.points.forEach((pt, i) => {
    if (pt.row % stride || pt.col % stride) return;
    const ws = field.ws[h][i], wd = field.wd[h][i];
    if (!Number.isFinite(ws) || !Number.isFinite(wd) || ws < 3) return;
    const v = windArrowVector(wd, L, zoom, pt.lat);
    const tail = [pt.lat - v.dLat / 2, pt.lon - v.dLon / 2];
    const tip = [pt.lat + v.dLat / 2, pt.lon + v.dLon / 2];
    const down = (wd + 180) % 360;
    // windArrowVector takes a FROM direction: +180 turns a pointing bearing into one.
    const barb = side => {
      const bv = windArrowVector(down + side + 180, 0.35 * L, zoom, tip[0]);
      return [tip[0] + bv.dLat, tip[1] + bv.dLon];
    };
    const bin = bins[windBin(ws)];
    bin.lines.push([tail, tip]);
    bin.lines.push([barb(150), tip, barb(-150)]);
  });
  return bins.filter(b => b.lines.length);
}

function mapZoom() {
  if (!mapInstance || typeof mapInstance.getZoom !== 'function') return null;
  const z = Number(mapInstance.getZoom());
  return Number.isFinite(z) ? z : null;
}

function isIndiaZoom() {
  const z = mapZoom();
  return z !== null && z <= INDIA_MAX_ZOOM;
}

function indiaLayersOn() {
  return !!(appState.layers.wind || appState.layers.pressure);
}

function saveIndiaCache(field) {
  try {
    const r1 = v => (Number.isFinite(v) ? Math.round(v) : null);
    const p1 = v => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
    localStorage.setItem(INDIA_CACHE_KEY, JSON.stringify({
      fetchedAt: field.fetchedAt,
      times: field.times,
      ws: field.ws.map(row => row.map(r1)),
      wd: field.wd.map(row => row.map(r1)),
      p: field.p.map(row => row.map(p1)),
      elev: field.elev.map(r1)
    }));
  } catch (e) { /* quota / private mode: cache is optional */ }
}

function loadIndiaCache(now = Date.now()) {
  try {
    const c = JSON.parse(localStorage.getItem(INDIA_CACHE_KEY) || 'null');
    const n = indiaSpec().points.length;
    if (!c || !Number.isFinite(c.fetchedAt) || now - c.fetchedAt >= INDIA_CACHE_MAX_MS || !Array.isArray(c.times)) return null;
    const okRows = a => Array.isArray(a) && a.length === c.times.length && a.every(row => Array.isArray(row) && row.length === n);
    if (!okRows(c.ws) || !okRows(c.wd) || !okRows(c.p) || !Array.isArray(c.elev) || c.elev.length !== n) return null;
    const nan = v => (v === null || !Number.isFinite(Number(v)) ? NaN : Number(v));
    return {
      times: c.times.map(Number),
      ws: c.ws.map(row => row.map(nan)),
      wd: c.wd.map(row => row.map(nan)),
      p: c.p.map(row => row.map(nan)),
      elev: c.elev.map(nan),
      fetchedAt: c.fetchedAt
    };
  } catch (e) {
    return null; // corrupt cache: refetch
  }
}

// Live only, map present, wind or pressure on, India zoom. 60-min TTL, one request in
// flight, back-off after a failure (60 min when rate-limited, else 15 min).
async function refreshIndiaField() {
  const st = appState.india;
  if (appState.activeScenario !== 'live' || !mapInstance || !indiaLayersOn() || !isIndiaZoom()) return;
  const now = Date.now();
  if (st.field && now - st.field.fetchedAt < INDIA_TTL_MS) return;
  if (indiaFetching) return;
  const fail = st.failure;
  if (fail && now - fail.at < (fail.rateLimited ? 60 : 15) * 60000) return;
  if (!st.field) {
    const cached = loadIndiaCache(now);
    if (cached) {
      st.field = cached;
      st.failed = false;
      rebuildTimeline();
      updateLayerStatus();
      if (now - cached.fetchedAt < INDIA_TTL_MS) return;
    }
  }
  indiaFetching = true;
  try {
    const spec = indiaSpec();
    const res = await fetchWithTimeout(indiaGridUrl(spec), {}, 25000); // 289-point request: first call can take ~15 s
    if (!res.ok) throw new Error('India grid API ' + res.status);
    const field = parseIndiaField(await readJsonWithTimeout(res, 20000), spec); // ~170–330 KB body
    st.field = field;
    st.failure = null;
    st.failed = false;
    saveIndiaCache(field);
    rebuildTimeline();
  } catch (e) {
    console.warn('India model fetch failed:', e);
    st.failure = { at: Date.now(), rateLimited: /\b429\b/.test(String(e && e.message)) };
    if (!st.field) st.failed = true;
  } finally {
    indiaFetching = false;
    updateLayerStatus();
  }
}

// Label / centre markers: Leaflet divIcon with a DOM element (no HTML strings). The
// zero-size icon box + CSS translate(-50%, -50%) on the child centres it on the point.
function mapLabelMarker(latlng, element) {
  return L.marker(latlng, {
    pane: 'rsMapLabel',
    interactive: false,
    keyboard: false,
    icon: L.divIcon({ className: 'rs-divicon', html: element, iconSize: [0, 0], iconAnchor: [0, 0] })
  });
}

function isobarLabelEl(level) {
  const el = document.createElement('span');
  el.className = 'rs-isobar-label';
  el.textContent = String(level);
  return el;
}

function pressureCentreEl(ctr, tagText) {
  const el = document.createElement('div');
  el.className = `rs-pcentre rs-pcentre-${ctr.kind}`;
  const letter = document.createElement('span');
  letter.className = 'rs-pcentre-letter';
  letter.textContent = ctr.kind;
  const hpa = document.createElement('span');
  hpa.className = 'rs-pcentre-hpa';
  hpa.textContent = String(Math.round(ctr.hPa));
  el.appendChild(letter);
  el.appendChild(hpa);
  if (tagText) {
    const tag = document.createElement('span');
    tag.className = 'rs-pcentre-tag';
    tag.textContent = tagText;
    el.appendChild(tag);
  }
  return el;
}

// Draw (or clear) wind arrows, isobars and L/H centres for a timeline frame. Model frames
// use their own hour; radar frames / no timeline use "now". Memoised on hour + zoom.
function renderIndiaLayers(frame) {
  if (!mapInstance || typeof L === 'undefined' || typeof L.layerGroup !== 'function') return;
  const field = appState.india && appState.india.field;
  const z = mapZoom();
  const tSec = frame && frame.kind === 'model' ? frame.t : Date.now() / 1000;
  const h = field ? indiaHourIndex(field, tSec) : -1;
  const visible = h !== -1 && z !== null && z <= INDIA_MAX_ZOOM && indiaLayersOn();
  const key = visible ? `${h}|${z}|${isMobileMap()}|${appState.layers.wind}|${appState.layers.pressure}|${field.fetchedAt}` : 'off'; // arrow weight differs on phones
  if (key === indiaRenderKey) return;
  indiaRenderKey = key;
  if (!indiaWindGroup) {
    indiaWindGroup = L.layerGroup();
    indiaIsoGroup = L.layerGroup();
    indiaLabelGroup = L.layerGroup();
  }
  [indiaWindGroup, indiaIsoGroup, indiaLabelGroup].forEach(g => { if (typeof g.clearLayers === 'function') g.clearLayers(); });
  if (!visible) {
    [indiaWindGroup, indiaIsoGroup, indiaLabelGroup].forEach(removeMapLayer);
    updateIndiaLegend();
    return;
  }
  const spec = indiaSpec();
  const add = (layer, group) => { if (layer && typeof layer.addTo === 'function') layer.addTo(group); };
  if (appState.layers.wind && typeof L.polyline === 'function') {
    const weight = isMobileMap() ? 1.6 : 2;
    windArrowSegments(field, h, z, spec).forEach(bin => {
      add(L.polyline(bin.lines, { pane: 'rsWind', color: bin.color, weight, opacity: 0.9, lineCap: 'round', lineJoin: 'round', interactive: false }), indiaWindGroup);
    });
  }
  if (appState.layers.pressure && typeof L.polyline === 'function') {
    field._iso = field._iso || {};
    field._ctr = field._ctr || {};
    if (!field._iso[h]) field._iso[h] = buildIsobars(field.p[h], spec);
    if (!field._ctr[h]) field._ctr[h] = findPressureCentres(field.p[h], spec, field.elev);
    field._iso[h].forEach(iso => {
      add(L.polyline(iso.lines, { pane: 'rsIsobar', color: '#ffffff', opacity: 0.5, weight: iso.major ? 1.6 : 1, interactive: false }), indiaIsoGroup);
      if (iso.labelAt && typeof L.marker === 'function' && typeof L.divIcon === 'function') {
        add(mapLabelMarker(iso.labelAt, isobarLabelEl(iso.level)), indiaLabelGroup);
      }
    });
    if (typeof L.marker === 'function' && typeof L.divIcon === 'function') {
      field._ctr[h].forEach(ctr => {
        const tag = ctr.kind === 'L' ? classifyLow(maxWindNear(field, h, ctr.lat, ctr.lon, 300)).label : '';
        add(mapLabelMarker([ctr.lat, ctr.lon], pressureCentreEl(ctr, tag)), indiaLabelGroup);
      });
    }
  }
  [indiaWindGroup, indiaIsoGroup, indiaLabelGroup].forEach(addMapLayer);
  updateIndiaLegend();
}

// All-India view (phone: clear of the top bar, right-hand buttons and the sheet).
function showIndiaView() {
  if (!mapInstance || typeof mapInstance.fitBounds !== 'function') return;
  appState.mapFocus = 'india';
  let opts = { padding: [10, 10], maxZoom: 5 };
  if (isMobileMap()) {
    snapSheetTo('peek'); // a half / full sheet would leave no room for India
    let bottom = (sheetState.visible || 0) + 12;
    const size = typeof mapInstance.getSize === 'function' ? mapInstance.getSize() : null;
    const mapH = size && Number(size.y);
    if (Number.isFinite(mapH) && mapH > 0) bottom = Math.min(bottom, Math.round(mapH * 0.5));
    opts = { paddingTopLeft: [12, 72], paddingBottomRight: [60, bottom], maxZoom: 5 };
  }
  mapInstance.fitBounds(INDIA_BOUNDS, opts);
}

// Zoom end: switch between local (rain grid) and India (wind/pressure) views, redraw the
// fixed-pixel arrows, and fetch the India field once it is actually on screen.
function onMapZoomEnd() {
  const bucket = isIndiaZoom() ? 'india' : 'local';
  if (bucket === 'local' && appState.mapFocus === 'india') appState.mapFocus = isMobileMap() ? 'radar' : 'route';
  const z = mapZoom();
  const gridZoom = z === null || z >= LOCAL_GRID_MIN_ZOOM; // local rain grid drawn (see showFrame)
  if (bucket !== indiaZoomBucket) {
    indiaZoomBucket = bucket;
    localGridZoomOn = gridZoom;
    rebuildTimeline(); // model source (local grid vs India field) depends on the zoom
  } else if (gridZoom !== localGridZoomOn) {
    localGridZoomOn = gridZoom; // zoom 7 is in the India bucket but also draws the local grid
    if (timelineState.frames.length) showFrame(timelineState.index);
  }
  renderIndiaLayers(timelineState.frames[timelineState.index] || null);
  updateLayerStatus();
  refreshIndiaField().catch(err => console.warn('India model refresh failed:', err));
}

// Sub-line of each layer toggle (both panels) reflects failures / zoom / cyclone count.
function layerStatusText(key, fallback) {
  if (key === 'wind' || key === 'pressure') {
    if (!appState.layers[key]) return fallback;
    if (appState.india.failed) return 'India model map unavailable';
    if (mapZoom() !== null && !isIndiaZoom()) return 'Zoom out or tap India to view';
    return fallback;
  }
  if (key === 'cyclones') {
    const st = appState.cyclones;
    if (st.failed && !st.events.length) return 'Cyclone feed unavailable';
    if (!st.fetchedAt) return fallback;
    if (!st.events.length) return 'No active cyclones in region';
    const asOf = st.asOf ? ` · as of ${fmtClock(new Date(st.asOf))}` : '';
    return `${st.events.length} active · GDACS${asOf}`;
  }
  return fallback;
}

function updateLayerStatus() {
  layerToggleInputs.forEach(t => {
    if (!t.sub || !t.def) return;
    const text = layerStatusText(t.key, t.def.sub);
    if (t.sub.textContent !== text) t.sub.textContent = text;
  });
  updateIndiaLegend();
}

function addIndiaLegendControl() {
  if (indiaLegendEl || !mapInstance || typeof L === 'undefined' || typeof L.control !== 'function') return;
  const ctl = L.control({ position: 'bottomleft' });
  ctl.onAdd = () => {
    const div = document.createElement('div');
    div.className = 'rs-india-legend';
    div.hidden = true;
    const row = (cls) => { const r = document.createElement('div'); r.className = `rs-il-row ${cls}`; div.appendChild(r); return r; };
    const text = (parent, cls, t) => { const s = document.createElement('span'); s.className = cls; s.textContent = t; parent.appendChild(s); return s; };

    const windRow = row('rs-il-wind');
    text(windRow, 'rs-il-title', 'Wind');
    WIND_BINS.forEach((b, i) => {
      const item = document.createElement('span');
      item.className = 'rs-wl-item';
      const sw = document.createElement('span');
      sw.className = 'rs-wl-sw';
      sw.style.background = b.color;
      item.appendChild(sw);
      text(item, 'rs-wl-label', i === WIND_BINS.length - 1 ? `${b.min}+` : String(b.min));
      windRow.appendChild(item);
    });
    text(windRow, 'rs-wl-unit', 'km/h');

    const isoRow = row('rs-il-pressure');
    text(isoRow, 'rs-il-text', '— isobars 2 hPa · L/H = model lows/highs (not IMD)');

    const tcRow = row('rs-il-tc');
    text(tcRow, 'rs-il-title', 'Cyclone alert');
    Object.keys(TC_ALERT_COLORS).forEach(level => {
      const item = document.createElement('span');
      item.className = 'rs-wl-item';
      const dot = document.createElement('span');
      dot.className = 'rs-tc-dot';
      dot.style.borderColor = TC_ALERT_COLORS[level];
      item.appendChild(dot);
      text(item, 'rs-wl-label', level);
      tcRow.appendChild(item);
    });
    if (L.DomEvent && typeof L.DomEvent.disableClickPropagation === 'function') L.DomEvent.disableClickPropagation(div);
    indiaLegendEl = div;
    updateIndiaLegend();
    return div;
  };
  ctl.addTo(mapInstance);
}

// Legend only while India layers are actually drawn; rows follow the layer toggles.
function updateIndiaLegend() {
  const div = indiaLegendEl;
  if (!div) return;
  const show = indiaLayersOn() && isIndiaZoom() && indiaFieldUsable(appState.india.field);
  div.hidden = !show;
  if (typeof div.querySelector !== 'function') return;
  const windRow = div.querySelector('.rs-il-wind');
  const isoRow = div.querySelector('.rs-il-pressure');
  const tcRow = div.querySelector('.rs-il-tc');
  if (windRow) windRow.hidden = !appState.layers.wind;
  if (isoRow) isoRow.hidden = !appState.layers.pressure;
  if (tcRow) tcRow.hidden = !appState.layers.cyclones;
}

// ============================================================================
// 8.66 CYCLONES (GDACS): ACTIVE STORMS, TRACK, WIND ZONES + "NEAR YOU" BANNER
// ============================================================================
// GDACS (EC JRC / UN) is a global disaster alert service, NOT the official RSMC New Delhi
// (IMD) warning: every surface says so and links to IMD. Failures never throw.

const TC_TTL_MS = 30 * 60000;
const TC_CACHE_KEY = 'rainstop_cyclones_v2'; // v2: track segments carry `forecast`
const TC_CACHE_OFFLINE_MS = 6 * 3600000;
const TC_BACKOFF_MS = 10 * 60000;
const TC_BBOX = { latS: -5, latN: 40, lonW: 40, lonE: 110 };
const TC_NEAR_KM = 800;
const TC_STALE_H = 48;
const TC_MAX_GEOM = 3;
const TC_ALERT_COLORS = { Green: '#22c55e', Orange: '#f59e0b', Red: '#ef4444' };
const IMD_URL = 'https://mausam.imd.gov.in/';

let cycloneFetching = false;
let tcGroup = null;
let tcRenderKey = '';
let cycloneAlertKey = '';

function gdacsListUrl(now = Date.now()) {
  const day = ms => new Date(ms).toISOString().slice(0, 10); // UTC dates
  return `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC&fromdate=${day(now - 7 * 86400000)}&todate=${day(now)}`;
}

function gdacsGeometryUrl(id, episode) {
  return `https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=TC&eventid=${encodeURIComponent(id)}&episodeid=${encodeURIComponent(episode)}`;
}

// Only https gdacs.org links are used as hrefs / fetch targets (feed content is untrusted).
function safeGdacsUrl(u) {
  return typeof u === 'string' && /^https:\/\/(www\.)?gdacs\.org\//.test(u) ? u : null;
}

// GDACS timestamps carry no zone: they are UTC.
function parseGdacsTime(s) {
  if (typeof s !== 'string' || !s) return NaN;
  return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
}

// Event list → current storms inside the North Indian Ocean box. Throws unless GeoJSON.
function parseGdacsEvents(json, nowMs = Date.now()) {
  if (!json || typeof json !== 'object' || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
    throw new Error('GDACS: not a GeoJSON FeatureCollection');
  }
  const events = [];
  json.features.forEach(f => {
    try {
      const p = f && f.properties;
      const g = f && f.geometry;
      if (!p || !g || g.type !== 'Point' || !Array.isArray(g.coordinates)) return;
      if (!(p.iscurrent === true || p.iscurrent === 'true')) return;
      const lon = Number(g.coordinates[0]), lat = Number(g.coordinates[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      if (lat < TC_BBOX.latS || lat > TC_BBOX.latN || lon < TC_BBOX.lonW || lon > TC_BBOX.lonE) return;
      if (p.eventid === undefined || p.eventid === null) return;
      const toMs = parseGdacsTime(p.todate);
      const ageH = Number.isFinite(toMs) ? (nowMs - toMs) / 3600000 : null;
      const sev = p.severitydata && typeof p.severitydata === 'object' ? p.severitydata : {};
      const sevVal = Number(sev.severity);
      const maxKmh = Number.isFinite(sevVal) && (!sev.severityunit || /km\/h/i.test(sev.severityunit)) ? Math.round(sevVal) : null;
      const alert = ['Green', 'Orange', 'Red'].includes(p.alertlevel) ? p.alertlevel : 'Green';
      const url = p.url && typeof p.url === 'object' ? p.url : {};
      const name = String(p.eventname || p.name || 'Unnamed').replace(/^Tropical Cyclone\s+/i, '').slice(0, 60);
      const episode = p.episodeid === undefined || p.episodeid === null ? '' : String(p.episodeid);
      events.push({
        id: String(p.eventid), episode, name, alert, lat, lon, maxKmh,
        severityText: typeof sev.severitytext === 'string' ? sev.severitytext.slice(0, 160) : '',
        toMs: Number.isFinite(toMs) ? toMs : null,
        ageH: ageH === null ? null : +ageH.toFixed(1),
        stale: ageH !== null && ageH > TC_STALE_H,
        country: typeof p.country === 'string' ? p.country.slice(0, 120) : '',
        reportUrl: safeGdacsUrl(url.report),
        geomUrl: safeGdacsUrl(url.geometry) || gdacsGeometryUrl(p.eventid, episode)
      });
    } catch (e) { /* malformed feature: skip */ }
  });
  return events;
}

// GDACS answers HTTP 204 with an empty body when no storm matches the dates: that is an
// empty list (success). Any other body must still be GeoJSON (parseGdacsEvents throws).
const GDACS_EMPTY_LIST = () => ({ type: 'FeatureCollection', features: [] });
async function readGdacsList(res) {
  if (res.status === 204) return GDACS_EMPTY_LIST();
  if (typeof res.text !== 'function') return res.json();
  const text = await res.text();
  if (typeof text !== 'string' || !text.trim()) return GDACS_EMPTY_LIST();
  return JSON.parse(text);
}

// Keep a ring to at most `max` points (always keeps the last point so rings stay closed).
function decimateRing(ring, max = 300) {
  if (!Array.isArray(ring) || ring.length <= max) return ring;
  const step = Math.ceil(ring.length / (max - 1));
  const out = [];
  for (let i = 0; i < ring.length; i += step) out.push(ring[i]);
  if (out[out.length - 1] !== ring[ring.length - 1]) out.push(ring[ring.length - 1]);
  return out;
}

// Event geometry → { zones: [{ level, label, rings }], cone, track: [{ cat, forecast, pts }], centroid }.
// forecast = GDACS `forecast: true` (future path); false segments are the past path.
// rings / cone are Leaflet multi-polygon latlngs: [polygon][ring][[lat, lon]].
// Only the overall wind zones (labels "60 km/h" / "90 km/h" / "120 km/h") are kept; the
// per-time zones (date labels) and per-point circles are ignored.
function parseGdacsGeometry(json) {
  if (!json || typeof json !== 'object' || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
    throw new Error('GDACS geometry: not a GeoJSON FeatureCollection');
  }
  const swap = pt => (Array.isArray(pt) && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])) ? [Number(pt[1]), Number(pt[0])] : null);
  const ringOf = r => decimateRing((Array.isArray(r) ? r : []).map(swap).filter(Boolean), 300);
  const polygons = g => {
    if (!g || !Array.isArray(g.coordinates)) return [];
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.map(poly => (Array.isArray(poly) ? poly.map(ringOf).filter(r => r.length >= 3) : [])).filter(p => p.length);
  };
  const out = { zones: [], cone: null, track: [], centroid: null };
  json.features.forEach(f => {
    const p = (f && f.properties) || {};
    const g = f && f.geometry;
    const cls = typeof p.Class === 'string' ? p.Class : '';
    const label = typeof p.polygonlabel === 'string' ? p.polygonlabel : '';
    if (/^Poly_(Green|Orange|Red)$/.test(cls) && /km\/h/.test(label)) {
      const rings = polygons(g);
      if (rings.length) out.zones.push({ level: cls.slice(5), label, rings });
    } else if (cls === 'Poly_Cones') {
      const rings = polygons(g);
      if (rings.length) out.cone = rings;
    } else if (/^Line_Line/.test(cls) && g) {
      const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
      (Array.isArray(lines) ? lines : []).forEach(line => {
        const pts = (Array.isArray(line) ? line : []).map(swap).filter(Boolean);
        if (pts.length >= 2) out.track.push({ cat: label || '', forecast: p.forecast === true, pts });
      });
    } else if (cls === 'Point_Centroid' && g && g.type === 'Point') {
      out.centroid = swap(g.coordinates);
    }
  });
  const order = { Green: 0, Orange: 1, Red: 2 };
  out.zones.sort((a, b) => order[a.level] - order[b.level]); // Red drawn last (on top)
  return out;
}

// Initial bearing (degrees from north) from point 1 to point 2.
function bearingDeg(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const y = Math.sin((lon2 - lon1) * rad) * Math.cos(lat2 * rad);
  const x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lon2 - lon1) * rad);
  return ((Math.atan2(y, x) / rad) + 360) % 360;
}

// Nearest non-stale storm within maxKm of origin — current position or a FORECAST track
// vertex (the past path is ignored) → { ev, km, dir, forecast } (dir = compass direction
// of that point from you; forecast = the nearest point is on the forecast track), or null.
function cycloneProximity(events, geom, origin, maxKm = TC_NEAR_KM) {
  if (!Array.isArray(events) || !origin || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lon)) return null;
  let best = null;
  events.forEach(ev => {
    if (!ev || ev.stale) return;
    const pts = [[ev.lat, ev.lon, false]];
    const g = geom && geom[`${ev.id}:${ev.episode}`];
    if (g && Array.isArray(g.track)) {
      g.track.forEach(seg => {
        if (seg && seg.forecast === true && Array.isArray(seg.pts)) seg.pts.forEach(pt => { if (Array.isArray(pt)) pts.push([pt[0], pt[1], true]); });
      });
    }
    pts.forEach(([lat, lon, forecast]) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      const km = haversineDistance(origin.lat, origin.lon, lat, lon);
      if (km <= maxKm && (!best || km < best.km)) best = { ev, km, lat, lon, forecast };
    });
  });
  if (!best) return null;
  return { ev: best.ev, km: best.km, dir: fmtWindDir(bearingDeg(origin.lat, origin.lon, best.lat, best.lon)), forecast: best.forecast };
}

function refreshEventAges(events, nowMs = Date.now()) {
  (events || []).forEach(ev => {
    if (!Number.isFinite(ev.toMs)) return;
    ev.ageH = +((nowMs - ev.toMs) / 3600000).toFixed(1);
    ev.stale = ev.ageH > TC_STALE_H;
  });
  return events;
}

function loadCycloneCache() {
  try {
    const c = JSON.parse(localStorage.getItem(TC_CACHE_KEY) || 'null');
    if (!c || !Number.isFinite(c.fetchedAt) || !Array.isArray(c.events)) return null;
    return { fetchedAt: c.fetchedAt, events: c.events, geom: c.geom && typeof c.geom === 'object' ? c.geom : {} };
  } catch (e) {
    return null;
  }
}

function saveCycloneCache(st) {
  try {
    localStorage.setItem(TC_CACHE_KEY, JSON.stringify({ fetchedAt: st.fetchedAt, events: st.events, geom: st.geom }));
  } catch (e) { /* quota / private mode: cache is optional */ }
}

// Live only. Event list every 30 min; geometry only for new storm episodes (≤ 3). Offline:
// a cache ≤ 6 h old is shown "as of" its time. Never throws.
async function refreshCyclones() {
  try {
    if (appState.activeScenario !== 'live' || typeof fetch !== 'function' || cycloneFetching) return;
    const st = appState.cyclones;
    const now = Date.now();
    if (st.fetchedAt && now - st.fetchedAt < TC_TTL_MS) return;
    if (st.failure && now - st.failure.at < TC_BACKOFF_MS) return;
    const cached = loadCycloneCache();
    if (!st.fetchedAt && cached && now - cached.fetchedAt < TC_TTL_MS) {
      Object.assign(st, { events: refreshEventAges(cached.events, now), geom: cached.geom, fetchedAt: cached.fetchedAt, failed: false, asOf: 0 });
      renderCycloneLayers();
      updateLayerStatus();
      updateUI();
      return;
    }
    cycloneFetching = true;
    try {
      const res = await fetchWithTimeout(gdacsListUrl(now), {}, 12000);
      if (!res.ok) throw new Error('GDACS ' + res.status);
      const events = parseGdacsEvents(await readGdacsList(res), Date.now());
      const geom = {};
      for (const ev of events.slice(0, TC_MAX_GEOM)) {
        const k = `${ev.id}:${ev.episode}`;
        if (st.geom && st.geom[k]) { geom[k] = st.geom[k]; continue; }
        try {
          const gr = await fetchWithTimeout(ev.geomUrl, {}, 12000);
          if (!gr.ok) throw new Error('GDACS geometry ' + gr.status);
          geom[k] = parseGdacsGeometry(await gr.json());
        } catch (e) {
          console.warn('GDACS geometry failed:', e);
        }
      }
      Object.assign(st, { events, geom, fetchedAt: Date.now(), failed: false, failure: null, asOf: 0 });
      saveCycloneCache(st);
    } catch (e) {
      console.warn('GDACS cyclone feed failed:', e);
      st.failure = { at: Date.now() };
      if (!st.events.length && cached && Date.now() - cached.fetchedAt < TC_CACHE_OFFLINE_MS) {
        Object.assign(st, { events: refreshEventAges(cached.events), geom: cached.geom, fetchedAt: cached.fetchedAt, failed: false, asOf: cached.fetchedAt });
      } else if (!st.events.length) {
        st.failed = true;
      }
    } finally {
      cycloneFetching = false;
    }
    updateLayerStatus();
    renderCycloneLayers();
    updateUI();
  } catch (e) {
    console.warn('Cyclone refresh failed:', e);
  }
}

function fmtAdvisoryTime(ms) {
  if (!Number.isFinite(ms)) return '–';
  return new Date(ms).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function externalLink(href, text) {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener');
  a.textContent = text;
  return a;
}

function cyclonePopupEl(ev) {
  const box = document.createElement('div');
  box.className = 'rs-tc-popup';
  const line = (cls, text) => {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    box.appendChild(d);
    return d;
  };
  line('rs-tc-popup-name', `🌀 ${ev.name}`);
  line('rs-tc-popup-alert', `GDACS ${ev.alert} alert`);
  line('rs-tc-popup-row', `Max wind ${isNum(ev.maxKmh) ? `~${ev.maxKmh} km/h` : '–'}`);
  const age = isNum(ev.ageH) ? ` (${Math.max(0, Math.round(ev.ageH))} h ago)` : '';
  line('rs-tc-popup-row', `Last advisory ${fmtAdvisoryTime(ev.toMs)}${age}${ev.stale ? ' — may have weakened' : ''}`);
  line('rs-tc-popup-note', 'Not an official warning — RSMC New Delhi (IMD) issues those.');
  const links = document.createElement('div');
  links.className = 'rs-tc-popup-links';
  if (ev.reportUrl) {
    links.appendChild(externalLink(ev.reportUrl, 'GDACS report'));
    links.appendChild(document.createTextNode(' · '));
  }
  links.appendChild(externalLink(IMD_URL, 'IMD (official)'));
  box.appendChild(links);
  return box;
}

function cycloneIconEl(ev) {
  const wrap = document.createElement('div');
  wrap.className = 'rs-tc-icon';
  wrap.setAttribute('data-alert', ev.alert);
  if (ev.stale) wrap.setAttribute('data-stale', '1');
  const glyph = document.createElement('span');
  glyph.className = 'rs-tc-glyph';
  glyph.textContent = '🌀';
  const name = document.createElement('span');
  name.className = 'rs-tc-name';
  name.textContent = ev.name;
  wrap.appendChild(glyph);
  wrap.appendChild(name);
  return wrap;
}

const TC_TRACK_COLORS = { TD: '#7dd3fc', TS: '#facc15' };
const TC_ZONE_FILL = { Green: 0.08, Orange: 0.12, Red: 0.16 };

// Storm position (clickable), track, cone and wind zones. All zooms.
function renderCycloneLayers() {
  if (!mapInstance || typeof L === 'undefined' || typeof L.layerGroup !== 'function') return;
  const st = appState.cyclones;
  const on = !!appState.layers.cyclones && st.events.length > 0;
  const key = on ? `${st.fetchedAt}|${st.events.map(e => `${e.id}:${e.episode}:${e.stale}`).join(',')}|${Object.keys(st.geom || {}).join(',')}` : 'off';
  if (key === tcRenderKey) return;
  tcRenderKey = key;
  if (!tcGroup) tcGroup = L.layerGroup();
  if (typeof tcGroup.clearLayers === 'function') tcGroup.clearLayers();
  if (!on) { removeMapLayer(tcGroup); return; }
  const add = layer => { if (layer && typeof layer.addTo === 'function') layer.addTo(tcGroup); };
  st.events.forEach(ev => {
    const g = st.geom && st.geom[`${ev.id}:${ev.episode}`];
    if (g && typeof L.polygon === 'function') {
      (g.zones || []).forEach(z => {
        const color = TC_ALERT_COLORS[z.level] || TC_ALERT_COLORS.Green;
        add(L.polygon(z.rings, { pane: 'rsCyclone', color, weight: 1, opacity: 0.7, fillColor: color, fillOpacity: TC_ZONE_FILL[z.level] || 0.08, interactive: false }));
      });
      if (g.cone) add(L.polygon(g.cone, { pane: 'rsCyclone', color: '#ffffff', weight: 1, opacity: 0.4, dashArray: '4 4', fill: false, interactive: false }));
    }
    if (g && typeof L.polyline === 'function') {
      (g.track || []).forEach(seg => {
        add(L.polyline(seg.pts, { pane: 'rsCyclone', color: TC_TRACK_COLORS[seg.cat] || '#ef4444', weight: 2, opacity: 0.9, interactive: false }));
      });
    }
    if (typeof L.marker === 'function' && typeof L.divIcon === 'function') {
      const marker = L.marker([ev.lat, ev.lon], {
        title: `Cyclone ${ev.name} (GDACS ${ev.alert})`,
        icon: L.divIcon({ className: 'rs-tc-marker', html: cycloneIconEl(ev), iconSize: [28, 28], iconAnchor: [14, 14] })
      });
      if (marker && typeof marker.bindPopup === 'function') marker.bindPopup(cyclonePopupEl(ev));
      add(marker);
    }
  });
  addMapLayer(tcGroup);
}

// "Near you" banner (status card + phone peek). GDACS storms only — never model lows.
function renderCycloneAlert() {
  const box = document.getElementById('cycloneAlert');
  const peekAlert = document.getElementById('mPeekAlert');
  const st = appState.cyclones;
  const hit = appState.activeScenario === 'live' && st
    ? cycloneProximity(st.events, st.geom, appState.originCoords || DEFAULT_COORDS, TC_NEAR_KM)
    : null;
  const km = hit ? Math.max(10, Math.round(hit.km / 10) * 10) : 0;
  const ageH = hit && isNum(hit.ev.ageH) ? Math.round(hit.ev.ageH) : null;
  const key = hit ? `${hit.ev.id}:${hit.ev.episode}|${km}|${hit.dir}|${hit.forecast}|${hit.ev.alert}|${hit.ev.maxKmh}|${hit.ev.name}|${ageH}` : 'none';
  if (key === cycloneAlertKey) return;
  cycloneAlertKey = key;
  if (box) {
    box.textContent = '';
    if (hit) {
      const ev = hit.ev;
      box.setAttribute('data-alert', ev.alert);
      const msg = document.createElement('span');
      msg.className = 'rs-cyclone-alert-text';
      const wind = isNum(ev.maxKmh) ? ` · max wind ${ev.maxKmh} km/h` : '';
      // Old advisories: say so — the storm may have weakened since (GDACS keeps it "current").
      const age = ageH !== null && ageH >= 12 ? ` (last advisory ${ageH} h ago — may have weakened)` : '';
      const where = hit.forecast ? `forecast track passes ~${km} km ${hit.dir} of you` : `~${km} km ${hit.dir} of you`;
      msg.textContent = `🌀 Cyclone ${ev.name} ${where} · GDACS ${ev.alert}${wind}${age}. Not an official warning — follow IMD. `;
      box.appendChild(msg);
      if (ev.reportUrl) {
        box.appendChild(externalLink(ev.reportUrl, 'GDACS'));
        box.appendChild(document.createTextNode(' · '));
      }
      box.appendChild(externalLink(IMD_URL, 'IMD'));
    } else {
      box.setAttribute('data-alert', '');
    }
    box.hidden = !hit;
  }
  if (peekAlert) {
    const wasHidden = !!peekAlert.hidden;
    peekAlert.textContent = hit ? `🌀 ${hit.ev.name} · ${hit.forecast ? 'track ' : ''}${km} km ${hit.dir} · ${hit.ev.alert}${ageH !== null && ageH >= 12 ? ` · ${ageH} h old` : ''}` : '';
    if (hit) peekAlert.setAttribute('data-alert', hit.ev.alert);
    peekAlert.hidden = !hit;
    if (wasHidden !== !hit && isMobileMap()) layoutSheet();
  }
}

// ============================================================================
// 8.7 CONDITIONS METRICS CARD + HOURLY CHART
// ============================================================================

let metricsRenderKey = '';
let metricsAnimated = false;

function buildMetricCard(c, animate) {
  const card = document.createElement('div');
  card.className = `metric-card tone-${c.tone || 'neutral'}${c.next ? ' is-next' : ''}${animate ? ' rs-rise' : ''}`;
  card.setAttribute('data-metric', c.id);
  const label = document.createElement('span');
  label.className = 'metric-label';
  label.textContent = c.label;
  const value = document.createElement('span');
  value.className = 'metric-value';
  if (isNum(c.arrowDeg)) {
    const arrow = document.createElement('span');
    arrow.className = 'metric-arrow';
    arrow.textContent = '↑';
    arrow.style.transform = `rotate(${Math.round(c.arrowDeg)}deg)`;
    value.appendChild(arrow);
  }
  const valueText = document.createElement('span');
  valueText.textContent = c.value;
  value.appendChild(valueText);
  const sub = document.createElement('span');
  sub.className = 'metric-sub';
  sub.textContent = c.sub || '';
  card.appendChild(label);
  card.appendChild(value);
  card.appendChild(sub);
  return card;
}

// SVG chart via createElementNS/setAttribute only (skipped where SVG isn't available).
function renderHourlyChart(el, model) {
  if (!el) return;
  el.textContent = '';
  if (!model || !model.bars.length) {
    const empty = document.createElement('div');
    empty.className = 'hourly-empty';
    empty.textContent = 'Hourly forecast loading…';
    el.appendChild(empty);
    return;
  }
  if (typeof document.createElementNS !== 'function') return;
  const node = (tag, attrs, text) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(k => n.setAttribute(k, String(attrs[k])));
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const svg = node('svg', { viewBox: `0 0 ${model.w} ${model.h}`, class: 'hourly-svg', role: 'img', 'aria-label': model.summary, preserveAspectRatio: 'none' });
  svg.appendChild(node('line', { x1: 0, y1: model.plotH + 0.5, x2: model.w, y2: model.plotH + 0.5, class: 'hc-axis' }));
  model.bars.forEach(b => {
    if (b.h > 0) svg.appendChild(node('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 2, fill: b.fill }));
    if (b.mmLabel) svg.appendChild(node('text', { x: +(b.x + b.w / 2).toFixed(1), y: +(b.y - 2).toFixed(1), class: 'hc-mm', 'text-anchor': 'middle' }, b.mmLabel));
  });
  if (model.tempPath) svg.appendChild(node('path', { d: model.tempPath, class: 'hc-temp', fill: 'none' }));
  model.temps.forEach(t => {
    svg.appendChild(node('circle', { cx: t.x, cy: t.y, r: 2, class: 'hc-temp-dot' }));
    if (t.showLabel) svg.appendChild(node('text', { x: t.x, y: +(t.y - 4).toFixed(1), class: 'hc-temp-label', 'text-anchor': 'middle' }, t.label));
  });
  model.ticks.forEach(t => svg.appendChild(node('text', { x: t.x, y: model.h - 3, class: 'hc-tick', 'text-anchor': 'middle' }, t.label)));
  el.appendChild(svg);
}

function renderMetrics() {
  const live = appState.activeScenario === 'live';
  const m = live && appState.metrics && sameSpot(appState.metrics, appState.originCoords) ? appState.metrics : null;
  const nowSec = Date.now() / 1000;

  // Phone top bar
  const mPlace = document.getElementById('mPlace');
  if (mPlace) mPlace.textContent = (appState.origin || DEFAULT_COORDS.name).split(',')[0].trim();
  const mTemp = document.getElementById('mTemp');
  if (mTemp) mTemp.textContent = m ? fmtTemp(m.tempC) : '–';
  const mStatus = document.getElementById('mStatus');
  if (mStatus) {
    const echo = live && appState.radar && appState.radar.status === 'echo';
    mStatus.textContent = !live ? 'SIMULATION' : echo ? 'RAIN ON RADAR' : 'LIVE';
    mStatus.setAttribute('data-tone', !live ? 'sim' : echo ? 'wet' : 'live');
  }

  const gridEl = document.getElementById('metricsGrid');
  if (!gridEl) return;
  const card = document.getElementById('metricsCard');
  const chartEl = document.getElementById('hourlyChart');
  const updatedEl = document.getElementById('metricsUpdated');
  const cards = live ? metricCards(m, appState.radar, nowSec) : null;
  const hourly = m && Array.isArray(m.hourly) ? m.hourly.filter(h => h.t > nowSec).slice(0, 12) : [];
  // Skip the DOM rebuild when nothing visible changed (updateUI runs on every slider move).
  const key = live ? JSON.stringify([cards, hourly.map(h => [h.t, h.mm, h.prob, h.tempC])]) : 'sim';
  if (key === metricsRenderKey) return;
  metricsRenderKey = key;

  if (card) card.classList.toggle('is-sim', !live);
  gridEl.textContent = '';
  if (!live) {
    const note = document.createElement('p');
    note.className = 'metrics-note';
    note.textContent = 'Live metrics shown in Live mode';
    gridEl.appendChild(note);
    if (chartEl) chartEl.textContent = '';
    if (updatedEl) updatedEl.textContent = 'Simulation';
    return;
  }
  const animate = !!m && !metricsAnimated; // one-shot rise on the first real fill
  cards.forEach(c => gridEl.appendChild(buildMetricCard(c, animate)));
  if (animate) metricsAnimated = true;
  if (updatedEl) updatedEl.textContent = m && m.at ? `Updated ${fmtClock(new Date(m.at * 1000))}` : 'Loading…';
  renderHourlyChart(chartEl, hourly.length ? buildHourlyChartModel(hourly) : null);
}

// ============================================================================
// 8.8 MAP-FIRST PHONE LAYOUT (full-screen map + draggable bottom sheet)
// ============================================================================
// One Leaflet map: on phones (<= 768px) #routeMap moves into the full-screen #mapStage and
// the cockpit moves into the sheet; on desktop every node goes back to where it was.

const sheetState = { snaps: null, snap: 'peek', visible: 0, drag: null, raf: null, suppressClick: false, lastW: 0, lastH: 0 };
const layoutState = { mobile: null, homes: new Map() };

function moveNodeTo(el, parent, before) {
  if (!el || !parent || !el.parentNode) return;
  if (!layoutState.homes.has(el)) {
    // Comment marker at the original spot: robust even when siblings move too.
    const marker = document.createComment('rs-home');
    el.parentNode.insertBefore(marker, el);
    layoutState.homes.set(el, marker);
  }
  parent.insertBefore(el, before || null);
}

function restoreNode(el) {
  const marker = el && layoutState.homes.get(el);
  if (marker && marker.parentNode) marker.parentNode.insertBefore(el, marker);
}

function applyLayoutMode(isMobile) {
  if (!document.body || isMobile === layoutState.mobile) return;
  layoutState.mobile = isMobile;
  document.body.classList.toggle('m-map', isMobile);
  // Also on <html>: it is the viewport scroller, so overscroll-behavior must live there to
  // stop Android pull-to-refresh / iOS bounce on the full-screen map.
  if (document.documentElement && document.documentElement.classList) document.documentElement.classList.toggle('m-map', isMobile);

  const byId = id => document.getElementById(id);
  const routeMap = byId('routeMap');
  const cockpit = document.querySelector('main.cockpit-grid');
  const headerControls = document.querySelector('.header-controls');
  const footer = document.querySelector('.app-footer');
  const timelineEl = byId('rsTimeline');
  const sheetScroll = byId('mSheetScroll');
  const mapSection = document.querySelector('.interactive-map-section');

  if (isMobile) {
    moveNodeTo(routeMap, byId('mapStage'));
    moveNodeTo(headerControls, byId('mActionsRow'));
    moveNodeTo(cockpit, sheetScroll);
    moveNodeTo(footer, sheetScroll);
    if (timelineEl && byId('mSheet') && sheetScroll) byId('mSheet').insertBefore(timelineEl, sheetScroll);
  } else {
    [routeMap, headerControls, cockpit, footer].forEach(restoreNode);
    if (timelineEl && mapSection) mapSection.appendChild(timelineEl);
  }

  setBaseLayer(isMobile);
  const rain = window.rainEngineInstance;
  if (rain) rain.setIntensity(rain.intensity, rain.windSpeed); // drops = 0 on the phone map
  // Resize first so the new view is computed for the new container size.
  mapInstance.invalidateSize({ pan: false });
  if (isMobile) {
    layoutSheet();
    snapSheetTo('peek');
    appState.mapFocus = 'radar';
    const o = appState.originCoords || DEFAULT_COORDS;
    mapInstance.setView([o.lat, o.lon], 9, { animate: false });
    refreshForecastGrid();
  } else {
    appState.mapFocus = 'route';
    stopTimeline();
    fitRouteBounds();
  }
  requestAnimationFrame(() => { if (mapInstance) mapInstance.invalidateSize({ pan: false }); });
}

// Resolve env(safe-area-inset-*) to px with a throwaway probe element.
function measureSafeAreas() {
  try {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
    document.body.appendChild(probe);
    const cs = window.getComputedStyle(probe);
    const res = { top: parseFloat(cs.height) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
    probe.parentNode.removeChild(probe);
    return res;
  } catch (e) {
    return { top: 0, bottom: 0 };
  }
}

function applySheetTransform(visible) {
  const el = document.getElementById('mSheet');
  if (!el || !sheetState.snaps) return;
  el.style.transform = `translate3d(0, ${Math.round(sheetState.snaps.full - visible)}px, 0)`;
}

function measurePeekContent() {
  const head = document.getElementById('mSheetHead');
  const tl = document.getElementById('rsTimeline');
  const h = (head && head.offsetHeight) || 0;
  const t = (tl && tl.parentNode && tl.parentNode.id === 'mSheet' && tl.offsetHeight) || 0;
  return h + t;
}

function layoutSheet() {
  const el = document.getElementById('mSheet');
  if (!el) return;
  const safe = measureSafeAreas();
  sheetState.lastW = window.innerWidth;
  sheetState.lastH = window.innerHeight;
  sheetState.snaps = sheetSnapsFor(window.innerHeight, safe.top, safe.bottom, measurePeekContent());
  el.style.height = `${sheetState.snaps.full}px`;
  snapSheetTo(sheetState.snap);
}

function snapSheetTo(name) {
  const el = document.getElementById('mSheet');
  if (!el || !sheetState.snaps || !(name in sheetState.snaps)) return;
  sheetState.snap = name;
  sheetState.visible = sheetState.snaps[name];
  el.classList.remove('dragging');
  el.setAttribute('data-snap', name);
  applySheetTransform(sheetState.visible);
  // Leaflet's bottom controls/attribution sit just above the sheet (set on settle only).
  document.documentElement.style.setProperty('--sheet-visible', `${sheetState.visible}px`);
  const handle = document.getElementById('mSheetHandle');
  if (handle) {
    handle.setAttribute('aria-expanded', String(name !== 'peek'));
    handle.setAttribute('aria-label', name === 'full' ? 'Collapse planner' : 'Expand planner');
  }
  const scroller = document.getElementById('mSheetScroll');
  if (scroller && name !== 'full') scroller.scrollTop = 0;
}

// startT = time the finger went down, so the first velocity sample isn't ~0 ms old.
function beginSheetDrag(y, startT) {
  const el = document.getElementById('mSheet');
  if (el) el.classList.add('dragging');
  sheetState.drag = { startY: y, startVisible: sheetState.visible, samples: [{ t: startT || performance.now(), y }] };
}

function moveSheetDrag(y) {
  const d = sheetState.drag;
  if (!d || !sheetState.snaps) return;
  const now = performance.now();
  d.samples.push({ t: now, y });
  while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift(); // last 100 ms
  const { peek, full } = sheetState.snaps;
  let v = d.startVisible + (d.startY - y);
  if (v < peek) v = peek - (peek - v) * 0.35; // rubber band below peek
  sheetState.visible = Math.min(full, v);
  if (!sheetState.raf) {
    sheetState.raf = requestAnimationFrame(() => { sheetState.raf = null; applySheetTransform(sheetState.visible); });
  }
}

function endSheetDrag() {
  const d = sheetState.drag;
  sheetState.drag = null;
  if (!d) return;
  const first = d.samples[0];
  const last = d.samples[d.samples.length - 1];
  const dt = last.t - first.t;
  // No fling if the finger rested before release or the samples are too close in time.
  const stale = performance.now() - last.t > 80;
  const velocity = (!stale && dt >= 16) ? (first.y - last.y) / dt : 0; // px/ms, + = upwards
  snapSheetTo(snapSheetTarget(sheetState.visible, velocity, sheetState.snaps));
}

function initBottomSheet() {
  const el = document.getElementById('mSheet');
  const head = document.getElementById('mSheetHead');
  const handle = document.getElementById('mSheetHandle');
  const peek = document.getElementById('mPeek');
  const scroller = document.getElementById('mSheetScroll');
  if (!el || !head || !scroller) return;

  // Pointer drags: on the head always; anywhere on the sheet at peek/half (content
  // doesn't scroll there). Form controls and the timeline keep their own gestures.
  let ptr = null;
  el.addEventListener('pointerdown', (e) => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || sheetState.drag) return;
    const t = e.target;
    const inHead = head.contains(t);
    if (!inHead) {
      if (sheetState.snap === 'full') return; // content scrolls; pull-down handled by touch events
      if (t.closest && t.closest('input, select, textarea, button')) return;
    }
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), started: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (!ptr.started) {
      const dx = e.clientX - ptr.x;
      const dy = e.clientY - ptr.y;
      if (Math.abs(dy) < 6 || Math.abs(dy) < Math.abs(dx)) {
        if (Math.abs(dx) > 12) ptr = null; // horizontal gesture: not ours
        return;
      }
      ptr.started = true;
      sheetState.suppressClick = true;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* capture is best effort */ }
      beginSheetDrag(ptr.y, ptr.t);
    }
    moveSheetDrag(e.clientY);
  });
  const finishPointer = (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const started = ptr.started;
    ptr = null;
    if (started) {
      endSheetDrag();
      setTimeout(() => { sheetState.suppressClick = false; }, 0);
    }
  };
  el.addEventListener('pointerup', finishPointer);
  el.addEventListener('pointercancel', finishPointer);

  // Full sheet: content scrolls; pulling down at scrollTop 0 drags the sheet instead.
  let pull = null;
  scroller.addEventListener('touchstart', (e) => {
    pull = sheetState.snap === 'full' && e.touches.length === 1 ? { y: e.touches[0].clientY, t: performance.now(), started: false } : null;
  }, { passive: true });
  scroller.addEventListener('touchmove', (e) => {
    if (!pull || (sheetState.snap !== 'full' && !pull.started)) return;
    const y = e.touches[0].clientY;
    if (!pull.started) {
      if (scroller.scrollTop > 0) { pull.y = y; pull.t = performance.now(); return; }
      if (y - pull.y < 6) {
        if (y < pull.y - 6) pull = null; // scrolling up: let the content scroll
        return;
      }
      if (!e.cancelable) { pull = null; return; }
      pull.started = true;
      beginSheetDrag(pull.y, pull.t);
    }
    e.preventDefault();
    moveSheetDrag(y);
  }, { passive: false });
  const finishTouch = () => {
    const started = pull && pull.started;
    pull = null;
    if (started) endSheetDrag();
  };
  scroller.addEventListener('touchend', finishTouch);
  scroller.addEventListener('touchcancel', finishTouch);

  // Handle: tap / Enter cycles peek → half → full → peek. Hero tap opens half.
  if (handle) {
    handle.addEventListener('click', () => {
      if (sheetState.suppressClick) { sheetState.suppressClick = false; return; }
      snapSheetTo(sheetState.snap === 'peek' ? 'half' : sheetState.snap === 'half' ? 'full' : 'peek');
    });
  }
  if (peek) {
    const openHalf = () => {
      if (sheetState.suppressClick) { sheetState.suppressClick = false; return; }
      snapSheetTo('half');
    };
    peek.addEventListener('click', openHalf);
    peek.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHalf(); }
    });
  }

  // Ignore the address-bar show/hide (height-only changes < 160 px).
  window.addEventListener('resize', () => {
    if (!isMobileMap()) return;
    if (window.innerWidth === sheetState.lastW && Math.abs(window.innerHeight - sheetState.lastH) < 160) return;
    layoutSheet();
  });
}

// Peek hero + top bar summary (phone map only).
function renderMobileSummary(plan, nowView) {
  if (!isMobileMap()) return;
  const data = appState.currentScenarioData;
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  let leave, unit, line, tone;
  if (plan) {
    const rec = plan.recommended;
    leave = rec.offsetMin === 0 ? 'NOW' : String(rec.offsetMin);
    unit = rec.offsetMin === 0
      ? (rec.kind === 'now' ? 'GOOD TO GO' : rec.kind === 'now-fair' ? 'FAIR CHANCE' : 'NO BETTER LATER')
      : (rec.kind === 'wait' ? 'MIN WAIT' : 'MIN · BEST BET');
    line = rec.offsetMin === 0
      ? `Leave now · ${fmtPct(rec.pOk)} chance your ${plan.tripMin}-min ${tripVerb()} stays dry enough`
      : `Leave ~${clockIn(rec.offsetMin)} · ${fmtPct(rec.pOk)} chance of a dry-enough trip`;
    tone = rec.pOk >= GOOD_P ? 'good' : rec.pOk >= FAIR_P ? 'fair' : 'poor';
  } else {
    leave = data.stopMinutes > 0 ? (data.stopBeyondHorizon ? formatStopShort(data) : String(data.stopMinutes)) : 'NOW';
    unit = data.stopMinutes > 0 ? 'MIN TO DRY' : 'SKY DRY';
    line = data.adviceHeadline || '';
    tone = data.stopMinutes > 0 ? 'poor' : 'good';
  }
  set('mPeekLeave', leave);
  set('mPeekUnit', unit);
  set('mPeekLine', line);
  set('mPeekSky', `${nowView ? nowView.icon : data.skyIcon} ${nowView ? nowView.title : data.skyTitle}`);
  const peek = document.getElementById('mPeek');
  if (peek) peek.setAttribute('data-tone', tone);
}

function initMapFirstLayout() {
  if (typeof L === 'undefined' || !mapInstance || !window.matchMedia || !document.body) return;
  ensureMapPanes();

  // Timeline lives under the desktop map until a phone layout moves it into the sheet.
  const timelineEl = buildTimelineControl();
  const mapSection = document.querySelector('.interactive-map-section');
  if (timelineEl && mapSection && !timelineEl.parentNode) mapSection.appendChild(timelineEl);

  addDesktopLayerControl();
  const panel = document.getElementById('mLayersPanel');
  if (panel) buildLayerToggles(panel);
  initBottomSheet();

  const byId = id => document.getElementById(id);
  const btnLayers = byId('mBtnLayers');
  const setPanel = (open) => {
    if (!panel) return;
    panel.hidden = !open;
    if (btnLayers) btnLayers.setAttribute('aria-expanded', String(open));
  };
  if (btnLayers) btnLayers.addEventListener('click', () => setPanel(panel && panel.hidden));
  mapInstance.on('click', () => setPanel(false));
  const btnGps = byId('mBtnGps');
  if (btnGps) btnGps.addEventListener('click', () => { const b = byId('btnAutoDetect'); if (b) b.click(); });
  const btnRecenter = byId('mBtnRecenter');
  if (btnRecenter) {
    btnRecenter.addEventListener('click', () => {
      appState.mapFocus = 'radar';
      const o = appState.originCoords || DEFAULT_COORDS;
      mapInstance.setView([o.lat, o.lon], 9);
    });
  }
  const btnRoute = byId('mBtnRoute');
  if (btnRoute) {
    btnRoute.addEventListener('click', () => {
      appState.mapFocus = 'route';
      if (!appState.layers.route) setMapLayer('route', true);
      fitRouteBounds();
    });
  }
  const btnIndia = byId('mBtnIndia');
  if (btnIndia) btnIndia.addEventListener('click', () => { setPanel(false); showIndiaView(); });

  // India layers: legend + redraw / refetch when the zoom changes
  addIndiaLegendControl();
  if (typeof mapInstance.on === 'function') mapInstance.on('zoomend', onMapZoomEnd);

  document.addEventListener('visibilitychange', () => { if (document.hidden) stopTimeline(); });

  const mq = window.matchMedia('(max-width: 768px)');
  const onChange = () => applyLayoutMode(mq.matches);
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
  applyLayoutMode(mq.matches);
  applyLayers();
}

// ============================================================================
// 9. WEB AUDIO HARMONIC CHIME & TOAST NOTIFICATION ENGINE
// ============================================================================

function playRainStopChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright resolution)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.55);
    });
  } catch (e) {}
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showToast(message, duration = 3200) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.remove) toast.remove();
      else if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

// ============================================================================
// 9.5 MULTI-TIER GEOLOCATION ENGINE (GPS + Reverse Geocode + IP Fallback)
// ============================================================================

async function detectLocationWithFallback(isUserTriggered = false) {
  const btn = document.getElementById('btnAutoDetect');
  const engLabel = document.getElementById('engineLabel');
  
  if (isUserTriggered && btn) {
    btn.innerHTML = '<span class="pulse-indicator"></span> 📡 Locating...';
    showToast("📡 Acquiring GPS satellite fix...", 3000);
  }

  // Reverse geocode coordinates to friendly city / neighborhood name
  async function getFriendlyLocationName(lat, lon, fallbackName) {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        const feat = data.features && data.features[0];
        const p = feat && feat.properties;
        if (p) {
          const parts = [p.name || p.district, p.city || p.county, p.country].filter(Boolean);
          if (parts.length > 0) return parts.slice(0, 2).join(', ');
        }
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }
    return fallbackName;
  }

  // IP-based Geolocation Fallback (free, HTTPS, fast, worldwide)
  async function fetchIpLocation() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const placeName = [data.city, data.country_name].filter(Boolean).join(', ') || "Local City (IP)";
          return { lat: parseFloat(data.latitude), lon: parseFloat(data.longitude), name: placeName };
        }
      }
    } catch (e) {
      console.warn("ipapi.co failed, trying geojs:", e);
    }

    try {
      const res2 = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.latitude && data2.longitude) {
          const placeName = [data2.city, data2.country].filter(Boolean).join(', ') || "Local City (IP)";
          return { lat: parseFloat(data2.latitude), lon: parseFloat(data2.longitude), name: placeName };
        }
      }
    } catch (e2) {
      console.warn("geojs.io failed:", e2);
    }

    return null;
  }

  function applyLocation(lat, lon, placeName, source) {
    appState.origin = placeName;
    appState.originCoords = { lat, lon };

    try {
      localStorage.setItem('rainstop_last_lat', String(lat));
      localStorage.setItem('rainstop_last_lon', String(lon));
      localStorage.setItem('rainstop_last_name', placeName);
    } catch (e) {}

    const inputO = document.getElementById('inputOrigin');
    if (inputO) inputO.value = placeName;
    if (originMarker) originMarker.setLatLng([lat, lon]);
    // Phone radar view stays zoomed out (regional rain); desktop zooms to the street.
    // A background fix keeps the all-India view; a GPS tap leaves it (the user asked to locate).
    if (isUserTriggered) appState.mapFocus = isMobileMap() ? 'radar' : 'route';
    if (mapInstance && (isUserTriggered || appState.mapFocus !== 'india')) mapInstance.setView([lat, lon], appState.mapFocus === 'radar' ? 9 : 14);

    const shortPlace = placeName.split(',')[0].trim();
    if (engLabel) engLabel.textContent = `${shortPlace} Live`;

    fetchLiveOpenMeteo(lat, lon, placeName);

    if (btn) btn.innerHTML = '📍 Auto-Detect';
    if (isUserTriggered) {
      showToast(`📍 Location locked (${source}): <strong>${escapeHtml(placeName)}</strong>`, 4000);
    }
  }

  // Instant display of cached coordinates on first load (no waiting)
  if (!isUserTriggered) {
    try {
      const savedLat = parseFloat(localStorage.getItem('rainstop_last_lat'));
      const savedLon = parseFloat(localStorage.getItem('rainstop_last_lon'));
      const savedName = localStorage.getItem('rainstop_last_name');
      if (!isNaN(savedLat) && !isNaN(savedLon)) {
        applyLocation(savedLat, savedLon, savedName || "Saved Location", "Cached");
      }
    } catch (e) {}
  }

  // 1. Query Browser GPS (with 10-second timeout, allowing cached fixes up to 5 minutes)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const placeName = await getFriendlyLocationName(lat, lon, "Your GPS Location");
        applyLocation(lat, lon, placeName, "GPS");
      },
      async (err) => {
        console.warn("Browser GPS unavailable or timed out, triggering IP Geolocation fallback:", err ? err.message : '');
        if (isUserTriggered) {
          showToast("⚠️ GPS prompt dismissed/unavailable. Falling back to city IP...", 3500);
        }
        const ipLoc = await fetchIpLocation();
        if (ipLoc) {
          applyLocation(ipLoc.lat, ipLoc.lon, ipLoc.name, "IP Geo");
        } else {
          // Last resort fallback
          try {
            const savedLat = parseFloat(localStorage.getItem('rainstop_last_lat'));
            const savedLon = parseFloat(localStorage.getItem('rainstop_last_lon'));
            const savedName = localStorage.getItem('rainstop_last_name');
            if (!isNaN(savedLat) && !isNaN(savedLon)) {
              applyLocation(savedLat, savedLon, savedName || "Saved Location", "Cached");
              return;
            }
          } catch (e) {}
          applyLocation(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name, "Default");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  } else {
    // Browser has no geolocation API -> IP Geolocation
    const ipLoc = await fetchIpLocation();
    if (ipLoc) {
      applyLocation(ipLoc.lat, ipLoc.lon, ipLoc.name, "IP Geo");
    } else {
      applyLocation(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name, "Default");
    }
  }
}

// ============================================================================
// 10. EVENT LISTENERS & COMMERCIAL POLISH FEATURES
// ============================================================================

let deferredInstallPrompt = null;
appState.isRainStopAlertActive = false;

function setupEventListeners() {
  // 1. Alert When Dry Button (Audio Chime + Push Notification)
  const btnAlert = document.getElementById('btnAlertRainStop');
  const alertBtnText = document.getElementById('alertBtnText');
  if (btnAlert) {
    btnAlert.addEventListener('click', () => {
      if (!appState.isRainStopAlertActive) {
        if ('Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission();
        }
        appState.isRainStopAlertActive = true;
        btnAlert.classList.add('active');
        alertBtnText.textContent = "Watching Sky...";
        playRainStopChime();
        showToast("🔔 Alert Active! We'll chime & notify you when rain clears overhead.");
      } else {
        appState.isRainStopAlertActive = false;
        btnAlert.classList.remove('active');
        alertBtnText.textContent = "Alert When Dry";
        showToast("🔕 Alert turned off.");
      }
    });
  }

  // 2. Share Commute Forecast Button (WhatsApp & Web Share API)
  const btnShare = document.getElementById('btnShareForecast');
  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const data = appState.currentScenarioData;
      const res = calculateWetnessAndConsequences();
      const originName = appState.origin.split(',')[0];
      const destName = appState.dest.split(',')[0];
      const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${appState.originCoords.lat.toFixed(4)}&lon=${appState.originCoords.lon.toFixed(4)}&q=${encodeURIComponent(originName)}`;
      
      const plan = appState.leavePlan;
      const shareText = `🌧️ RainStop Forecast for ${originName}:\n` +
        (plan
          ? (planTarget(plan).offsetMin === 0
            ? `✅ Leave now (${fmtPct(plan.candidates[0].pOk)} chance of a dry-enough trip)\n`
            : `⏱️ Best time to leave: ~${clockIn(planTarget(plan).offsetMin)} (${fmtPct(planTarget(plan).pOk)} chance dry enough; now ${fmtPct(plan.candidates[0].pOk)})\n`)
          : data.stopBeyondHorizon
          ? `⏱️ No dry break forecast for ${formatStopShort(data)}\n`
          : `⏱️ Rain easing in: ${data.stopMinutes} mins\n`) +
        `🚶 Commute: ${originName} ➔ ${destName} (${appState.routeDistanceKm} km)\n` +
        `👕 Outcome: Tier ${res.tier} - ${res.tierHeadline}\n` +
        `🛡️ Gear: ${appState.gear.umbrella ? '🌂 Umbrella' : appState.gear.raincoat ? '🧥 Raincoat' : 'No Gear'}\n` +
        `👉 Check live weather nowcast: ${shareUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "RainStop Commute Forecast",
            text: shareText,
            url: shareUrl
          });
          showToast("📤 Shared successfully!");
          return;
        } catch (e) {}
      }

      // Fallback: Copy to clipboard & open WhatsApp
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("📋 Sharable forecast link copied to clipboard!");
      } catch (e) {
        showToast("📱 Opening WhatsApp...");
      }

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    });
  }

  // 3. Simulation Labs Drawer Modal
  const btnOpenLabs = document.getElementById('btnOpenLabs');
  const btnCloseLabs = document.getElementById('btnCloseLabs');
  const labsModal = document.getElementById('labsModal');
  const scenarioCards = document.querySelectorAll('.lab-scenario-card');

  if (btnOpenLabs && labsModal) {
    btnOpenLabs.addEventListener('click', () => {
      labsModal.classList.add('open');
    });
  }

  if (labsModal) {
    // Tap on the dark backdrop closes the popup
    labsModal.addEventListener('click', (e) => {
      if (e.target === labsModal) labsModal.classList.remove('open');
    });
  }
  if (btnCloseLabs && labsModal) {
    btnCloseLabs.addEventListener('click', () => {
      labsModal.classList.remove('open');
    });
  }

  scenarioCards.forEach(card => {
    card.addEventListener('click', () => {
      scenarioCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const scenarioKey = card.dataset.scenario;
      if (scenarioKey === 'live') {
        appState.activeScenario = 'live';
        appState.currentScenarioData = SCENARIOS.live;
        updateUI();
        const o = appState.originCoords || DEFAULT_COORDS;
        fetchLiveOpenMeteo(o.lat, o.lon, appState.origin || DEFAULT_COORDS.name);
      } else {
        appState.activeScenario = scenarioKey;
        appState.currentScenarioData = { ...SCENARIOS[scenarioKey] };
        document.getElementById('livePulsingDot').textContent = `● LABS (${card.querySelector('.lab-card-title').textContent})`;
        updateUI();
      }

      if (labsModal) labsModal.classList.remove('open');
      showToast(`🧪 Loaded scenario: ${card.querySelector('.lab-card-title').textContent}`);
    });
  });

  // PWA Install Prompt Listener
  const btnInstallPwa = document.getElementById('btnInstallPwa');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (btnInstallPwa) {
      btnInstallPwa.classList.remove('hidden');
    }
  });

  if (btnInstallPwa) {
    btnInstallPwa.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          btnInstallPwa.classList.add('hidden');
        }
        deferredInstallPrompt = null;
      }
    });
  }

  // Network Status Listeners (Online / Offline)
  const offlineBanner = document.getElementById('offlineBanner');
  window.addEventListener('online', () => {
    if (offlineBanner) offlineBanner.classList.add('hidden');
    const o = appState.originCoords || DEFAULT_COORDS;
    fetchLiveOpenMeteo(o.lat, o.lon, appState.origin || DEFAULT_COORDS.name);
  });

  window.addEventListener('offline', () => {
    if (offlineBanner) offlineBanner.classList.remove('hidden');
  });

  // The old "WeatherNext 3" switch never called a Google model (it only scaled rain by 0.92),
  // so it is hidden; the ids stay for backwards compatibility. Forget any saved choice.
  try { localStorage.removeItem('rainstop_weather_engine'); } catch (e) {}

  // "Damp socks OK" tolerance toggle (per-viewer preference)
  const toggleDampOk = document.getElementById('toggleDampOk');
  if (toggleDampOk) {
    toggleDampOk.checked = appState.dampOk;
    toggleDampOk.addEventListener('change', (e) => {
      appState.dampOk = e.target.checked;
      try { localStorage.setItem('rainstop_damp_ok', appState.dampOk ? '1' : '0'); } catch (err) {}
      updateUI();
    });
  }

  // GPS button with multi-tier detection
  document.getElementById('btnAutoDetect').addEventListener('click', () => {
    detectLocationWithFallback(true);
  });

  // Ground truth buttons: record a 30-min report; the forecast still drives the future.
  function reportGroundTruth(type) {
    const wasLab = appState.activeScenario !== 'live';
    appState.groundReport = { type, at: Date.now() };
    appState.activeScenario = 'live';
    SCENARIOS.live = validateForecastPayload(applyGroundReport({ ...SCENARIOS.live }));
    appState.currentScenarioData = SCENARIOS.live;
    if (wasLab) {
      document.querySelectorAll('.lab-scenario-card').forEach(c => c.classList.toggle('active', c.dataset.scenario === 'live'));
      document.getElementById('livePulsingDot').textContent = "● LIVE";
      const o = appState.originCoords || DEFAULT_COORDS;
      fetchLiveOpenMeteo(o.lat, o.lon, appState.origin || DEFAULT_COORDS.name);
    }
    updateUI();
    showToast(type === 'rain'
      ? "🌧️ <strong>Noted:</strong> raining here. This lowers the chance of a dry trip for the next ~30 min."
      : "☀️ <strong>Noted:</strong> dry here now. Rain the forecast shows later in your trip still counts.", 4500);
  }
  const btnReportRain = document.getElementById('btnReportRain');
  if (btnReportRain) btnReportRain.addEventListener('click', () => reportGroundTruth('rain'));
  const btnReportDry = document.getElementById('btnReportDry');
  if (btnReportDry) btnReportDry.addEventListener('click', () => reportGroundTruth('dry'));

  // Recenter map button
  const btnLocateCampus = document.getElementById('btnLocateCampus');
  if (btnLocateCampus) {
    btnLocateCampus.addEventListener('click', () => {
      if (mapInstance) mapInstance.setView([DEFAULT_COORDS.lat, DEFAULT_COORDS.lon], 15);
    });
  }

  // Photon Autocomplete setup for Origin and Destination
  setupPhotonAutocomplete('inputOrigin', 'suggestOrigin', 'btnClearOrigin', 'origin');
  setupPhotonAutocomplete('inputDest', 'suggestDest', 'btnClearDest', 'dest');

  // Popular Route Chips
  const routeChips = document.querySelectorAll('.route-chip');
  routeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      routeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const orig = chip.dataset.orig;
      const dest = chip.dataset.dest;
      const dist = parseFloat(chip.dataset.dist) || 1.8;

      document.getElementById('inputOrigin').value = orig;
      document.getElementById('inputDest').value = dest;
      appState.origin = orig;
      appState.dest = dest;
      appState.routeDistanceKm = dist;

      const foundO = PLACES_DATABASE.find(p => p.name.includes(orig) || orig.includes(p.name));
      const foundD = PLACES_DATABASE.find(p => p.name.includes(dest) || dest.includes(p.name));
      if (foundO) appState.originCoords = { lat: foundO.lat, lon: foundO.lon };
      if (foundD) appState.destCoords = { lat: foundD.lat, lon: foundD.lon };

      if (originMarker && appState.originCoords) originMarker.setLatLng([appState.originCoords.lat, appState.originCoords.lon]);
      if (destMarker && appState.destCoords) destMarker.setLatLng([appState.destCoords.lat, appState.destCoords.lon]);

      focusNewTrip();
      fetchAndDrawRoute();
    });
  });

  // Transport Mode Buttons
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.transportMode = btn.dataset.mode;
      fetchAndDrawRoute();
    });
  });

  // Gear Checkbox Cards
  const gearUmbrella = document.getElementById('gearUmbrella');
  const gearRaincoat = document.getElementById('gearRaincoat');
  const gearShoeCovers = document.getElementById('gearShoeCovers');
  const gearBagCover = document.getElementById('gearBagCover');

  function syncGearCard(input, cardId) {
    const card = document.getElementById(cardId);
    if (input.checked) card.classList.add('active');
    else card.classList.remove('active');
  }

  gearUmbrella.addEventListener('change', (e) => {
    appState.gear.umbrella = e.target.checked;
    if (e.target.checked && appState.gear.raincoat) {
      appState.gear.raincoat = false;
      gearRaincoat.checked = false;
      syncGearCard(gearRaincoat, 'cardRaincoat');
    }
    syncGearCard(e.target, 'cardUmbrella');
    updateUI();
  });

  gearRaincoat.addEventListener('change', (e) => {
    appState.gear.raincoat = e.target.checked;
    if (e.target.checked && appState.gear.umbrella) {
      appState.gear.umbrella = false;
      gearUmbrella.checked = false;
      syncGearCard(gearUmbrella, 'cardUmbrella');
    }
    syncGearCard(e.target, 'cardRaincoat');
    updateUI();
  });

  gearShoeCovers.addEventListener('change', (e) => {
    appState.gear.shoeCovers = e.target.checked;
    syncGearCard(e.target, 'cardShoeCovers');
    updateUI();
  });

  gearBagCover.addEventListener('change', (e) => {
    appState.gear.bagCover = e.target.checked;
    syncGearCard(e.target, 'cardBagCover');
    updateUI();
  });

  // Interactive Avatar Zone Inspection Tooltips
  const avatarTooltip = document.getElementById('avatarTooltip');
  const zoneInfo = {
    zoneHead: { name: "Head & Hair", dryText: "100% Dry • No drops on hair", dampText: "Slight mist • Hair lightly damp", soakedText: "Waterlogged • Hair drenched" },
    zoneTorso: { name: "Torso & Chest", dryText: "Dry & Crisp • Shirt/Jacket protected", dampText: "Damp fabric • Minor wind seepage", soakedText: "Soaked through • Shirt sticking to skin" },
    zoneBackpack: { name: "Backpack / Laptop", dryText: "100% Safe • Laptop compartment dry", dampText: "Moist fabric • Use waterproof sleeve", soakedText: "CRITICAL • Water seeping into laptop" },
    zoneLegs: { name: "Pants & Jeans", dryText: "Clean & Dry • Zero road spray", dampText: "Damp cuffs • Splashes from walking", soakedText: "Soaked wet • Jeans waterlogged to knees" },
    zoneShoes: { name: "Footwear & Socks", dryText: "White Sneaker Safe • Bone dry soles", dampText: "Slight splashes • Avoid deep puddles", soakedText: "Squishy socks • Water over shoe collar" }
  };

  Object.keys(zoneInfo).forEach(zoneId => {
    const el = document.getElementById(zoneId);
    if (!el) return;
    el.addEventListener('mouseenter', () => {
      if (!avatarTooltip) return;
      const res = calculateWetnessAndConsequences();
      const statusKey = zoneId === 'zoneHead' ? 'head' : zoneId === 'zoneTorso' ? 'torso' : zoneId === 'zoneBackpack' ? 'backpack' : zoneId === 'zoneLegs' ? 'legs' : 'shoes';
      const status = res.bodyStatus[statusKey];
      const desc = status === 'dry' ? zoneInfo[zoneId].dryText : status === 'damp' ? zoneInfo[zoneId].dampText : zoneInfo[zoneId].soakedText;
      avatarTooltip.innerHTML = `🔎 <strong>${zoneInfo[zoneId].name}</strong>: ${desc}`;
      avatarTooltip.style.borderColor = status === 'dry' ? '#10b981' : status === 'damp' ? '#f59e0b' : '#ef4444';
    });

    el.addEventListener('mouseleave', () => {
      if (!avatarTooltip) return;
      const res = calculateWetnessAndConsequences();
      avatarTooltip.innerHTML = `💡 <strong>Tier ${res.tier} (${res.tierHeadline})</strong> • Hover body zones for details`;
      avatarTooltip.style.borderColor = res.badgeColor;
    });
  });

  // Departure Slider
  const slider = document.getElementById('departureSlider');
  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    appState.departureDelayMins = val;
    updateUI();
  });

  // Swap route button
  document.getElementById('btnSwapRoute').addEventListener('click', () => {
    const orig = document.getElementById('inputOrigin');
    const dest = document.getElementById('inputDest');
    const temp = orig.value;
    orig.value = dest.value;
    dest.value = temp;
    appState.origin = orig.value;
    appState.dest = dest.value;

    const tempCoords = appState.originCoords;
    appState.originCoords = appState.destCoords;
    appState.destCoords = tempCoords;

    if (originMarker) originMarker.setLatLng([appState.originCoords.lat, appState.originCoords.lon]);
    if (destMarker) destMarker.setLatLng([appState.destCoords.lat, appState.destCoords.lon]);

    focusNewTrip();
    fetchAndDrawRoute();
  });

  // Bottom drawer pick buttons
  document.getElementById('btnPickWait').addEventListener('click', () => {
    const mins = bestDepartureMins();
    if (mins > Number(slider.max)) showToast(`⏱️ Best time ~${clockIn(mins)} is beyond the ${Number(slider.max) / 60} h scrubber.`, 4000);
    slider.value = Math.min(Number(slider.max), mins);
    slider.dispatchEvent(new Event('input'));
  });

  document.getElementById('btnPickNow').addEventListener('click', () => {
    slider.value = 0;
    slider.dispatchEvent(new Event('input'));
  });
}

function initMobileNavigation() {
  const colRoute = document.getElementById('colRoute');
  const btnOpenRouteSheet = document.getElementById('btnOpenRouteSheet');
  const btnCloseRouteSheet = document.getElementById('btnCloseRouteSheet');
  const routeSheetBackdrop = document.getElementById('routeSheetBackdrop');
  const btnMobileWait = document.getElementById('btnMobileWait');
  const slider = document.getElementById('departureSlider');

  function openRouteSheet() {
    if (colRoute) colRoute.classList.add('sheet-open');
    if (routeSheetBackdrop) routeSheetBackdrop.classList.add('active');
    if (mapInstance) {
      setTimeout(() => mapInstance.invalidateSize(), 300);
    }
  }

  function closeRouteSheet() {
    if (colRoute) colRoute.classList.remove('sheet-open');
    if (routeSheetBackdrop) routeSheetBackdrop.classList.remove('active');
  }

  if (btnOpenRouteSheet) btnOpenRouteSheet.addEventListener('click', openRouteSheet);
  if (btnCloseRouteSheet) btnCloseRouteSheet.addEventListener('click', closeRouteSheet);
  if (routeSheetBackdrop) routeSheetBackdrop.addEventListener('click', closeRouteSheet);

  if (btnMobileWait && slider) {
    btnMobileWait.addEventListener('click', () => {
      const mins = bestDepartureMins();
      slider.value = Math.min(Number(slider.max), mins);
      slider.dispatchEvent(new Event('input'));
      showToast(mins > Number(slider.max)
        ? `⏱️ Best time ~${clockIn(mins)} is beyond the ${Number(slider.max) / 60} h scrubber.`
        : `⏱️ Departure set for ${mins > 0 ? `~${clockIn(mins)} (+${mins}m)` : 'NOW'} — best time to leave`);
    });
  }
}

// ============================================================================
// 10. BOOTSTRAP & SERVICE WORKER REGISTRATION
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA Offline Caching
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('🌧️ RainStop Service Worker registered with scope:', reg.scope);
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }

  window.rainEngineInstance = new RainEngine('rainCanvas');
  setupEventListeners();
  initMobileNavigation();
  initInteractiveMap();
  // Phone map-first layout + radar timeline + layer toggles (needs Leaflet; otherwise the
  // scrolling layout above stays as the fallback).
  initMapFirstLayout();

  // 1. Immediately update UI synchronously on millisecond 0 with live clock time
  updateUI();

  // 2. Real-time Clock Ticker: Keep departure times and clocks ticking live every 30s
  setInterval(() => {
    updateUI();
  }, 30000);

  // 3. Fetch live weather (URL params, Cached location, or High-Accuracy GPS / IP Fallback)
  const urlParams = new URLSearchParams(window.location.search);
  const paramLat = parseFloat(urlParams.get('lat'));
  const paramLon = parseFloat(urlParams.get('lon'));
  const paramQ = urlParams.get('q');

  if (!isNaN(paramLat) && !isNaN(paramLon)) {
    const sharedName = paramQ || "Shared Location"; // URLSearchParams already decodes
    appState.origin = sharedName;
    appState.originCoords = { lat: paramLat, lon: paramLon };
    const inputO = document.getElementById('inputOrigin');
    if (inputO) inputO.value = sharedName;
    if (originMarker) originMarker.setLatLng([paramLat, paramLon]);
    if (mapInstance) mapInstance.setView([paramLat, paramLon], appState.mapFocus === 'radar' ? 9 : 15);
    fetchLiveOpenMeteo(paramLat, paramLon, sharedName);
  } else {
    // Automatically detect real user location: Cached -> Precision GPS -> IP Geolocation Fallback
    detectLocationWithFallback(false);
  }

  // Automatic Nowcast Heartbeat: Re-fetch every 2.5 minutes while tab is active
  setInterval(() => {
    if (appState.activeScenario === 'live' && !document.hidden) {
      const coords = appState.originCoords || DEFAULT_COORDS;
      fetchLiveOpenMeteo(coords.lat, coords.lon, appState.origin || DEFAULT_COORDS.name);
    }
  }, 150000);

  // Auto-sync whenever user returns to this tab / unlocks screen
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && appState.activeScenario === 'live') {
      const elapsed = Date.now() - lastSuccessfulFetchTime;
      if (elapsed > 120000) {
        const coords = appState.originCoords || DEFAULT_COORDS;
        fetchLiveOpenMeteo(coords.lat, coords.lon, appState.origin || DEFAULT_COORDS.name);
      }
    }
  });
});

