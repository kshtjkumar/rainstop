/**
 * RainStop • Human Wetness & Commute Planner Engine
 * Real-time Precipitation Doppler Engine + Relatable Human Consequence Simulator
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
    name: "IIT Kanpur (Live Doppler)",
    skyTitle: "Live Sky Status",
    skySubtitle: "Fetching Doppler radar at 26.51°N, 80.23°E...",
    skyIcon: "🌤️",
    stopMinutes: 0,
    rainProfile: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    windSpeed: 7,
    puddleRisk: "Dry (< 1 cm)",
    rainIntensity: "dry_now",
    lightning: false,
    adviceHeadline: "Safe to walk on Campus",
    adviceDesc: "Live atmospheric radar shows dry/gentle conditions over IIT Kanpur.",
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
  mapPinMode: 'origin' // 'origin' | 'dest'
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
    else if (level === 'dry_now') this.maxDrops = 15;
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

function calculateWetnessAndConsequences() {
  const data = appState.currentScenarioData;
  const delay = appState.departureDelayMins;
  
  const bucketIdx = Math.min(Math.floor(delay / 5), data.rainProfile.length - 1);
  const rainRateAtDeparture = data.rainProfile[bucketIdx] || 0;

  let speedKmH = 4.5;
  if (appState.transportMode === 'walk') speedKmH = 4.5;
  else if (appState.transportMode === 'scooter') speedKmH = 25.0;
  else if (appState.transportMode === 'car') speedKmH = 18.0;

  const tripDurationMins = Math.max(2, Math.round((appState.routeDistanceKm / speedKmH) * 60));

  const isHighWind = data.windSpeed > 30;

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
  } else if (appState.transportMode === 'car') {
    // 100% Enclosed Automobile Cabin: fully shielded from rain & road spray
    bodyStatus.head = 'dry';
    bodyStatus.torso = 'dry';
    bodyStatus.backpack = 'dry';
    bodyStatus.legs = 'dry';
    bodyStatus.shoes = 'dry';
  } else if (appState.transportMode === 'scooter') {
    // 2-Wheeler Transit: Umbrellas impossible, driving at 25 km/h into rain
    if (appState.gear.raincoat) {
      bodyStatus.head = 'dry';
      bodyStatus.torso = 'dry';
      bodyStatus.legs = 'dry';
    } else {
      bodyStatus.head = rainRateAtDeparture > 2 ? 'soaked' : 'damp';
      bodyStatus.torso = rainRateAtDeparture > 1 ? 'soaked' : 'damp';
      bodyStatus.legs = 'soaked';
    }
    bodyStatus.backpack = (appState.gear.bagCover || appState.gear.raincoat) ? 'dry' : (rainRateAtDeparture > 2 ? 'soaked' : 'damp');
    bodyStatus.shoes = appState.gear.shoeCovers ? 'dry' : 'soaked';
  } else {
    // Pedestrian Walking Mode
    // Head:
    if (appState.gear.raincoat) {
      bodyStatus.head = 'dry';
    } else if (appState.gear.umbrella) {
      bodyStatus.head = isHighWind ? 'damp' : 'dry';
    } else {
      bodyStatus.head = rainRateAtDeparture > 3 ? 'soaked' : 'damp';
    }

    // Torso:
    if (appState.gear.raincoat) {
      bodyStatus.torso = 'dry';
    } else if (appState.gear.umbrella) {
      bodyStatus.torso = (isHighWind && rainRateAtDeparture > 4) ? 'damp' : 'dry';
    } else {
      bodyStatus.torso = rainRateAtDeparture > 2 ? 'soaked' : 'damp';
    }

    // Backpack:
    if (appState.gear.bagCover || appState.gear.raincoat) {
      bodyStatus.backpack = 'dry';
    } else {
      bodyStatus.backpack = rainRateAtDeparture > 3 ? 'soaked' : 'damp';
    }

    // Legs:
    if (appState.gear.raincoat) {
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
    if (appState.gear.shoeCovers) {
      bodyStatus.shoes = 'dry';
    } else {
      if (rainRateAtDeparture > 3 || (rainRateAtDeparture > 0 && data.puddleRisk && data.puddleRisk.includes('High'))) {
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
    bodyStatus,
    rainRateAtDeparture,
    tripDurationMins
  };
}

// ============================================================================
// 5. UI RENDER & DOM SYNCHRONIZATION
// ============================================================================

function updateUI() {
  const data = appState.currentScenarioData;
  const result = calculateWetnessAndConsequences();

  // 1. Sky Banner & Countdown
  document.getElementById('skyTitle').textContent = data.skyTitle;
  document.getElementById('skySubtitle').textContent = data.skySubtitle;
  document.getElementById('skyIcon').textContent = data.skyIcon;
  document.getElementById('puddleRisk').textContent = data.puddleRisk;
  document.getElementById('windSpeed').textContent = `${data.windSpeed} km/h`;

  const countdownCaption = document.querySelector('.countdown-caption');
  const timerUnit = document.querySelector('.timer-unit');
  const timelineLabels = document.querySelector('.timeline-labels');
  const timelineBar = document.getElementById('timelineBar');
  const now = new Date();

  if (data.stopMinutes === 0) {
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
    document.getElementById('stopMinutes').textContent = data.stopMinutes;
    if (timerUnit) timerUnit.textContent = "MINUTES";
    const stopDate = new Date(now.getTime() + data.stopMinutes * 60000);
    const timeString = stopDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('stopClockTime').textContent = `Safe to step out at ~${timeString}`;
    const timelinePct = Math.max(15, Math.min(100, 100 - (data.stopMinutes * 2.5)));
    if (timelineBar) {
      timelineBar.style.width = `${timelinePct}%`;
      timelineBar.style.background = "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)";
    }
    if (timelineLabels) {
      const halfMins = Math.round(data.stopMinutes / 2);
      timelineLabels.innerHTML = `
        <span>Now (Rain)</span>
        <span>${halfMins}m (Easing)</span>
        <span>${data.stopMinutes}m (Dry Sky)</span>
      `;
    }
  }

  // 2. 60-Minute Chart Bars
  const chartEl = document.getElementById('minutelyChart');
  chartEl.innerHTML = '';
  data.rainProfile.forEach((val, idx) => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    const height = Math.min(48, Math.max(4, val * 3.5));
    col.style.height = `${height}px`;

    if (val > 8) col.classList.add('heavy');
    else if (val > 3) col.classList.add('moderate');
    else if (val > 0) col.classList.add('light');
    else col.classList.add('dry');

    col.title = `+${idx * 5}m: ${val} mm/h`;
    chartEl.appendChild(col);
  });

  // 3. Advice Card
  document.getElementById('adviceHeadline').textContent = data.adviceHeadline;
  document.getElementById('adviceDesc').textContent = data.adviceDesc;

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

    if (appState.departureDelayMins === 0) {
      scrubText.innerHTML = `Leave <strong>NOW</strong> (~${depStr}) ➔ Arrive ~${arrStr} (Tier ${result.tier})`;
    } else {
      scrubText.innerHTML = `Leave in <strong>+${appState.departureDelayMins}m</strong> (~${depStr}) ➔ Arrive ~${arrStr} (Tier ${result.tier})`;
    }
  }

  // 9. Route Weather Ribbon (Along-Path Radar)
  renderRouteRibbon();

  // 10. Comparison Cards
  const isCurrentlyDry = data.stopMinutes === 0;
  const nowTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isCurrentlyDry) {
    document.getElementById('compWaitTitle').textContent = `Zero Wait Needed (Sky Clear)`;
    document.getElementById('compNowTitle').textContent = `Leave Now (${nowTimeString})`;
    document.getElementById('compNowSub').textContent = `Tier 0: Bone Dry & Crisp`;
  } else {
    const waitDepartureTime = new Date(now.getTime() + data.stopMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('compWaitTitle').textContent = `Wait ${data.stopMinutes} mins (Leave ~${waitDepartureTime})`;
    document.getElementById('compNowTitle').textContent = `Leave Now (${nowTimeString})`;
    document.getElementById('compNowSub').textContent = `Tier ${result.tier}: ${result.tierHeadline}`;
  }

  // Update rain canvas
  if (window.rainEngineInstance) {
    window.rainEngineInstance.setIntensity(data.rainIntensity, data.windSpeed);
    if (data.lightning && Math.random() > 0.6) {
      window.rainEngineInstance.triggerLightning();
    }
  }

  // Trigger chime and notification if Alert When Dry is active and rain has stopped
  if (appState.isRainStopAlertActive && data.stopMinutes === 0) {
    playRainStopChime();
    showToast("🎉 <strong>Sky is Clear!</strong> Rain has stopped overhead. Safe to step out!", 5000);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("RainStop • Sky is Clear! 🌤️", {
          body: "Overhead precipitation has stopped at IIT Kanpur. Perfect time for your commute!",
          icon: "icon.svg"
        });
      } catch (e) {}
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

  if (stripTimer) {
    if (data.stopMinutes > 0) {
      stripTimer.textContent = `${data.stopMinutes}m to dry`;
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
    mobileWaitMins.textContent = data.stopMinutes > 0 ? `${data.stopMinutes}m` : 'Now';
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

  // Derive dynamic checkpoints directly from active user route & live weather profile
  const currentPrecip = (data.rainProfile && data.rainProfile[0]) || 0;
  const stopMins = data.stopMinutes || 0;

  const originRain = currentPrecip > 4 ? "heavy" : currentPrecip > 1.5 ? "moderate" : currentPrecip > 0.2 ? "light" : "dry";
  const midRainRate = +(currentPrecip * 0.75).toFixed(1);
  const midRain = midRainRate > 4 ? "heavy" : midRainRate > 1.5 ? "moderate" : midRainRate > 0.2 ? "light" : "dry";
  const destRainRate = stopMins > 25 ? +(currentPrecip > 3 ? 1.8 : 0.4).toFixed(1) : 0;
  const destRain = destRainRate > 4 ? "heavy" : destRainRate > 1.5 ? "moderate" : destRainRate > 0.2 ? "light" : "dry";

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

    node.innerHTML = `
      <span class="cp-badge" title="${idx === 0 ? 'Origin' : idx === checkpoints.length - 1 ? 'Destination' : 'Waypoint'}">${markerLabel} ${weatherIcon}</span>
      <span class="cp-name" title="${cp.name}">${cp.name}</span>
      <span class="cp-rain ${cp.rain}">${cp.text}</span>
    `;
    trackEl.appendChild(node);
  });

  const isAnyRain = checkpoints.some(c => c.rain !== 'dry') || currentPrecip > 0.1;

  if (warningEl) {
    if (isAnyRain) {
      warningEl.textContent = `⚠️ Live Doppler alert: Active rain cell (${currentPrecip.toFixed(1)} mm/h) along ${originShort} ➔ ${destShort} route.`;
    } else {
      warningEl.textContent = `🟢 Clear skies detected along ${originShort} ➔ ${destShort} route.`;
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
    row.innerHTML = `
      <span class="auto-icon">${icon}</span>
      <div class="auto-text">
        <div class="auto-title">${title}</div>
        <div class="auto-subtitle">${sub}</div>
      </div>
    `;
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
}

let lastSuccessfulFetchTime = 0;

async function fetchLiveOpenMeteo(lat = 26.5123, lon = 80.2329, placeName = "IIT Kanpur, Uttar Pradesh") {
  try {
    document.getElementById('livePulsingDot').textContent = "● FETCHING LIVE...";
    
    // Request 48-hour window (forecast_days=2) so midnight wrap-around never exhausts the array
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation,weathercode&hourly=precipitation,windspeed_10m,weathercode&current_weather=true&forecast_days=2&timezone=auto`;
    const res = await fetchWithTimeout(url, {}, 6500);
    if (!res.ok) throw new Error("API error: " + res.status);
    const json = await res.json();

    // 1. Precise Epoch Timestamp Alignment
    const nowTimeStr = json.current_weather ? json.current_weather.time : null;
    const nowMs = nowTimeStr ? new Date(nowTimeStr).getTime() : Date.now();
    const wcode = json.current_weather ? json.current_weather.weathercode : 0;
    const wind = json.current_weather ? json.current_weather.windspeed : 10;
    const temp = json.current_weather ? json.current_weather.temperature : 26;

    // Find mathematically closest interval to current minute
    let startIndex = 0;
    if (json.minutely_15 && Array.isArray(json.minutely_15.time)) {
      let minDiff = Infinity;
      json.minutely_15.time.forEach((tStr, idx) => {
        const tMs = new Date(tStr).getTime();
        const diff = Math.abs(tMs - nowMs);
        if (diff < minDiff) {
          minDiff = diff;
          startIndex = idx;
        }
      });
    }

    const minutelyPrecip = json.minutely_15 && json.minutely_15.precipitation 
      ? json.minutely_15.precipitation.slice(startIndex, startIndex + 12) 
      : [0,0,0,0,0,0,0,0,0,0,0,0];
    const minutelyCodes = json.minutely_15 && json.minutely_15.weathercode 
      ? json.minutely_15.weathercode.slice(startIndex, startIndex + 12) 
      : [];

    // 2. Multi-Signal Meteorological Consensus (WMO Code + Radar Rain Rate + Hourly Model)
    // WMO Weather Codes for precipitation:
    // 51, 53, 55: Drizzle (light, moderate, dense)
    // 56, 57: Freezing Drizzle
    // 61, 63, 65: Rain (slight, moderate, heavy)
    // 66, 67: Freezing Rain
    // 80, 81, 82: Rain showers (slight, moderate, violent)
    // 95, 96, 99: Thunderstorm
    const isWmoRain = (wcode >= 51 && wcode <= 67) || (wcode >= 80 && wcode <= 99);
    
    // Check hourly model for confirmation
    let isHourlyRain = false;
    if (json.hourly && Array.isArray(json.hourly.weathercode)) {
      const currentHourCode = json.hourly.weathercode[Math.floor(startIndex / 4)] || 0;
      if ((currentHourCode >= 51 && currentHourCode <= 67) || (currentHourCode >= 80 && currentHourCode <= 99)) {
        isHourlyRain = true;
      }
    }

    let baseRate = minutelyPrecip[0] || 0;
    if ((isWmoRain || isHourlyRain) && baseRate < 0.8) {
      baseRate = (wcode >= 65 || wcode >= 82 || wcode >= 95) ? 8.5 : (wcode >= 63 || wcode >= 81) ? 4.5 : 2.0;
    }
    const currentPrecip = baseRate;
    const isRainingNow = isWmoRain || isHourlyRain || currentPrecip > 0.1;

    // 3. Dynamic Stop-Minutes Calculation
    let stopMins = 0;
    if (isRainingNow) {
      const stopIdx = minutelyPrecip.findIndex((p, i) => i > 0 && p < 0.1 && (!minutelyCodes[i] || minutelyCodes[i] < 51));
      if (stopIdx !== -1) {
        stopMins = stopIdx * 15;
      } else {
        stopMins = 45; // Persistent cell
      }
    } else {
      stopMins = 0;
    }

    // 4. Condition Headline & Icon
    let conditionTitle = "Clear Sky / Dry";
    let conditionIcon = "🌤️";
    if (wcode >= 95) {
      conditionTitle = "Severe Thunderstorm";
      conditionIcon = "⛈️";
    } else if (currentPrecip > 6 || wcode >= 65 || wcode >= 82) {
      conditionTitle = "Heavy Monsoon Downpour";
      conditionIcon = "🌧️";
    } else if (currentPrecip > 2 || wcode >= 63 || wcode >= 81) {
      conditionTitle = "Active Rain Shower";
      conditionIcon = "🌧️";
    } else if (isRainingNow || wcode >= 51) {
      conditionTitle = "Live Rain / Drizzle";
      conditionIcon = "🌦️";
    }

    const payload = {
      name: `Live: ${placeName}`,
      skyTitle: conditionTitle,
      skySubtitle: `📍 ${placeName} (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E) • ${temp}°C • ${wind} km/h wind`,
      skyIcon: conditionIcon,
      stopMinutes: stopMins,
      rainProfile: minutelyPrecip.length >= 12 
        ? minutelyPrecip.map((p, i) => i === 0 ? Math.max(p, currentPrecip) : p) 
        : [currentPrecip, currentPrecip * 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      windSpeed: Math.round(wind),
      puddleRisk: currentPrecip > 4 ? "High (4-6 cm)" : currentPrecip > 1 ? "Moderate (2-3 cm)" : "Low (< 1 cm)",
      rainIntensity: currentPrecip > 5 ? 'heavy' : currentPrecip > 0.3 ? 'light' : 'dry_now',
      lightning: wcode >= 95 || currentPrecip > 8,
      adviceHeadline: stopMins > 0 ? `Rain easing in ~${stopMins} mins (Wait 1 Chai)` : "100% Clear Skies at IIT Kanpur",
      adviceDesc: stopMins > 0 
        ? `Live Doppler nowcast detects active precipitation (${currentPrecip.toFixed(1)} mm/h). Stepping out now without gear will soak clothes. Rain clears in ~${stopMins} mins.` 
        : "Zero precipitation detected over campus. Perfect weather to step out.",
      routePockets: [
        { name: "Main Gate", dist: "0.0 km", rain: currentPrecip > 4 ? "heavy" : currentPrecip > 0.3 ? "light" : "dry", text: `${currentPrecip.toFixed(1)} mm/h` },
        { name: "SAC Circle", dist: "0.8 km", rain: currentPrecip > 2 ? "moderate" : currentPrecip > 0.3 ? "light" : "dry", text: `${(currentPrecip * 0.7).toFixed(1)} mm/h` },
        { name: "Library", dist: "1.8 km", rain: stopMins > 30 ? "light" : "dry", text: stopMins > 30 ? "0.5 mm/h" : "0 mm/h" }
      ],
      routeAlert: isRainingNow 
        ? `⚠️ Live Doppler alert: Active rain cell (${currentPrecip.toFixed(1)} mm/h) over campus route.` 
        : `🟢 Clear campus skies detected along Main Gate to Library route.`
    };

    // 5. Sanity Audit & Local Cache Storage with Timestamp
    const validated = validateForecastPayload(payload);
    SCENARIOS.live = validated;
    lastSuccessfulFetchTime = Date.now();

    localStorage.setItem('rainstop_cached_forecast_v2', JSON.stringify({
      timestamp: Date.now(),
      data: validated
    }));

    appState.currentScenarioData = validated;
    document.getElementById('livePulsingDot').textContent = `● LIVE (${placeName.split(',')[0]})`;
    updateUI();
  } catch (err) {
    console.warn("Live weather fetch failed, attempting cached fallback:", err);
    const rawCached = localStorage.getItem('rainstop_cached_forecast_v2') || localStorage.getItem('rainstop_cached_forecast');
    if (rawCached) {
      try {
        const parsed = JSON.parse(rawCached);
        const data = parsed.data || parsed;
        const cacheAgeMins = parsed.timestamp ? Math.round((Date.now() - parsed.timestamp) / 60000) : 999;
        
        if (cacheAgeMins < 120) {
          SCENARIOS.live = validateForecastPayload(data);
          appState.currentScenarioData = SCENARIOS.live;
          document.getElementById('livePulsingDot').textContent = `● CACHED (${cacheAgeMins}m ago)`;
          updateUI();
          return;
        }
      } catch (e) { /* ignore */ }
    }
    document.getElementById('livePulsingDot').textContent = "● OFFLINE FALLBACK";
  }
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
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
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
      
      const shareText = `🌧️ RainStop Forecast for ${originName}:\n` +
        `⏱️ Rain easing in: ${data.stopMinutes} mins\n` +
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
        fetchLiveOpenMeteo(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name);
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
    fetchLiveOpenMeteo(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name);
  });

  window.addEventListener('offline', () => {
    if (offlineBanner) offlineBanner.classList.remove('hidden');
  });

  // GPS button
  document.getElementById('btnAutoDetect').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveOpenMeteo(pos.coords.latitude, pos.coords.longitude, "Your GPS Location");
          if (mapInstance) mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 15);
        },
        () => fetchLiveOpenMeteo(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name)
      );
    } else {
      fetchLiveOpenMeteo(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name);
    }
  });

  // Ground truth rain button
  const btnReportRain = document.getElementById('btnReportRain');
  if (btnReportRain) {
    btnReportRain.addEventListener('click', () => {
      SCENARIOS.live.skyTitle = "Live Rain Shower (Observed)";
      SCENARIOS.live.skyIcon = "🌧️";
      SCENARIOS.live.stopMinutes = 45;
      SCENARIOS.live.rainIntensity = 'moderate';
      SCENARIOS.live.rainProfile = [4.2, 3.8, 2.5, 1.5, 0.8, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
      SCENARIOS.live.adviceHeadline = "Rain easing in ~45 mins (Wait 1 Chai)";
      SCENARIOS.live.adviceDesc = "Active overhead precipitation calibrated with live ground observation. Stepping out now without gear will soak clothes. Rain clears in ~45 mins.";
      appState.currentScenarioData = SCENARIOS.live;
      updateUI();
      showToast("🌧️ <strong>Live Rain Confirmed!</strong> Nowcast calibrated to active rain cell.", 4000);
    });
  }

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
    const stopMins = (appState.currentScenarioData && appState.currentScenarioData.stopMinutes !== undefined) 
      ? appState.currentScenarioData.stopMinutes 
      : 0;
    slider.value = Math.min(45, stopMins);
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
      const stopMins = (appState.currentScenarioData && appState.currentScenarioData.stopMinutes !== undefined)
        ? appState.currentScenarioData.stopMinutes
        : 0;
      slider.value = Math.min(45, stopMins);
      slider.dispatchEvent(new Event('input'));
      showToast(`⏱️ Departure set for ${stopMins > 0 ? `+${stopMins}m` : 'NOW'} (Dry arrival)!`);
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

  // 3. Fetch live weather (URL params, GPS auto-detect, or default)
  const urlParams = new URLSearchParams(window.location.search);
  const paramLat = parseFloat(urlParams.get('lat'));
  const paramLon = parseFloat(urlParams.get('lon'));
  const paramQ = urlParams.get('q');

  if (!isNaN(paramLat) && !isNaN(paramLon)) {
    const sharedName = paramQ ? decodeURIComponent(paramQ) : "Shared Location";
    appState.origin = sharedName;
    appState.originCoords = { lat: paramLat, lon: paramLon };
    const inputO = document.getElementById('inputOrigin');
    if (inputO) inputO.value = sharedName;
    if (originMarker) originMarker.setLatLng([paramLat, paramLon]);
    if (mapInstance) mapInstance.setView([paramLat, paramLon], 15);
    fetchLiveOpenMeteo(paramLat, paramLon, sharedName);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchLiveOpenMeteo(pos.coords.latitude, pos.coords.longitude, "Your Current Location");
        if (mapInstance) mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 15);
      },
      () => {
        fetchLiveOpenMeteo(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name);
      },
      { timeout: 3500 }
    );
  } else {
    fetchLiveOpenMeteo(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.name);
  }

  // Automatic Nowcast Heartbeat: Re-fetch every 2.5 minutes while tab is active
  setInterval(() => {
    if (appState.currentScenarioData === SCENARIOS.live && !document.hidden) {
      const coords = appState.originCoords || DEFAULT_COORDS;
      fetchLiveOpenMeteo(coords.lat, coords.lon, appState.origin || DEFAULT_COORDS.name);
    }
  }, 150000);

  // Auto-sync whenever user returns to this tab / unlocks screen
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && appState.currentScenarioData === SCENARIOS.live) {
      const elapsed = Date.now() - lastSuccessfulFetchTime;
      if (elapsed > 120000) {
        const coords = appState.originCoords || DEFAULT_COORDS;
        fetchLiveOpenMeteo(coords.lat, coords.lon, appState.origin || DEFAULT_COORDS.name);
      }
    }
  });
});

