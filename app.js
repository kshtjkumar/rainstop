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
  dampOk: (() => { try { return localStorage.getItem('rainstop_damp_ok') === '1'; } catch (e) { return false; } })()
};

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
    this.initDrops();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setIntensity(level, windSpeed = 15) {
    this.intensity = level;
    this.wind = (windSpeed - 10) * 0.15;
    if (level === 'heavy') this.maxDrops = 320;
    else if (level === 'moderate') this.maxDrops = 180;
    else if (level === 'light') this.maxDrops = 80;
    else if (level === 'dry_now') this.maxDrops = 0; // 100% zero raindrops when dry!
    this.initDrops();
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

    requestAnimationFrame(() => this.animate());
  }
}

// ============================================================================
// 3. LEAFLET INTERACTIVE ROAD MAP ENGINE
// ============================================================================

let mapInstance = null;
let originMarker = null;
let destMarker = null;
let routeLineLayer = null;

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

  // 100% Free Official OpenStreetMap Tiles (Zero Watermarks • No Key Required)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

  // Map Click Listener: automatically moves the closer pin
  mapInstance.on('click', async (e) => {
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

      // Draw glowing cyan route line
      routeLineLayer = L.geoJSON(route.geometry, {
        style: {
          color: '#38bdf8',
          weight: 5,
          opacity: 0.9,
          dashArray: '2, 6'
        }
      }).addTo(mapInstance);

      if (mapInstance) {
        mapInstance.fitBounds(routeLineLayer.getBounds(), { padding: [30, 30] });
      }
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
    }).addTo(mapInstance);
    mapInstance.fitBounds(routeLineLayer.getBounds(), { padding: [30, 30] });
  }
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&minutely_15=precipitation,weather_code&hourly=precipitation,weather_code,temperature_2m&forecast_days=2&timeformat=unixtime&timezone=auto`;
    const res = await fetchWithTimeout(url, {}, 6500);
    if (!res.ok) throw new Error("API error: " + res.status);
    const json = await res.json();
    // Drop responses for a location the user has already moved away from (e.g. cached
    // location fetch finishing after the GPS fix) — they would clobber the newer data.
    if (!sameSpot(appState.originCoords, { lat, lon })) return;

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
        data: validated
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
  await Promise.all(jobs);
}

// ---------------------------------------------------------------------------
// RainViewer radar: map overlay + positive-only "rain observed here" signal.
// Radar coverage over India is patchy, so NO echo is never treated as "dry".
// ---------------------------------------------------------------------------

let radarLayer = null;
let radarControl = null;
let radarLabelEl = null;
let radarVisible = true;

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
  return { host: json.host, frame, ageMin: Math.round((Date.now() / 1000 - frame.time) / 60) };
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

function updateRadarOverlay(meta) {
  if (!mapInstance || typeof L === 'undefined') return;
  if (radarLayer) mapInstance.removeLayer(radarLayer);
  radarLayer = L.tileLayer(`${meta.host}${meta.frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
    opacity: 0.55,
    maxNativeZoom: 7,
    maxZoom: 19,
    zIndex: 300,
    attribution: 'Radar © <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>'
  });
  if (radarVisible) radarLayer.addTo(mapInstance);

  if (!radarControl) {
    radarControl = L.control({ position: 'topright' });
    radarControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'radar-toggle-control');
      div.style.cssText = 'background:rgba(15,23,42,0.85);color:#e2e8f0;padding:4px 8px;border-radius:8px;font:12px Inter,sans-serif;';
      const label = document.createElement('label');
      label.style.cursor = 'pointer';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = radarVisible;
      radarLabelEl = document.createElement('span');
      label.appendChild(box);
      label.appendChild(document.createTextNode(' '));
      label.appendChild(radarLabelEl);
      div.appendChild(label);
      L.DomEvent.disableClickPropagation(div);
      box.addEventListener('change', (e) => {
        radarVisible = e.target.checked;
        if (radarLayer) {
          if (radarVisible) radarLayer.addTo(mapInstance);
          else mapInstance.removeLayer(radarLayer);
        }
      });
      return div;
    };
    radarControl.addTo(mapInstance);
  }
  if (radarLabelEl) radarLabelEl.textContent = `Radar ${fmtClock(new Date(meta.frame.time * 1000))} (${meta.ageMin} min old)`;
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
    if (mapInstance) mapInstance.setView([lat, lon], 14);

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
    if (mapInstance) mapInstance.setView([paramLat, paramLon], 15);
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

