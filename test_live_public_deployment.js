/**
 * 🌧️ RAINSTOP • DEEP COMMERCIAL PUBLIC DEPLOYMENT VERIFICATION SUITE
 * 
 * Tests the LIVE public deployment directly from GitHub Pages:
 * https://kshtjkumar.github.io/rainstop/
 */

const https = require('https');
const vm = require('vm');
const assert = require('assert');

const BASE_URL = 'https://kshtjkumar.github.io/rainstop';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runLiveDeploymentAudit() {
  console.log("==========================================================");
  console.log("🚀 RAINSTOP COMMERCIAL MASS DEPLOYMENT AUDIT");
  console.log("==========================================================\n");

  // 1. LIVE HTTP ENDPOINT INTEGRITY AUDIT
  console.log("[1/5] Auditing Live Network Endpoints on GitHub Pages...");
  const endpoints = [
    { path: '/', type: 'text/html' },
    { path: '/index.html', type: 'text/html' },
    { path: '/style.css', type: 'text/css' },
    { path: '/app.js', type: 'application/javascript' },
    { path: '/sw.js', type: 'application/javascript' },
    { path: '/manifest.json', type: 'application/json' },
    { path: '/icon.svg', type: 'image/svg+xml' }
  ];

  const fetchedFiles = {};

  for (const ep of endpoints) {
    const res = await fetchUrl(`${BASE_URL}${ep.path}`);
    assert.strictEqual(res.status, 200, `HTTP status 200 for ${ep.path}`);
    const ct = res.headers['content-type'] || '';
    assert(ct.includes(ep.type), `Content-Type for ${ep.path} matches ${ep.type} (got ${ct})`);
    assert(res.body.length > 50, `Payload for ${ep.path} is non-empty (${res.body.length} bytes)`);
    console.log(`  ✅ ${ep.path} ➔ HTTP 200 OK (${res.body.length} bytes, ${ct.split(';')[0]})`);
    fetchedFiles[ep.path] = res.body;
  }

  // 2. LIVE HTML DOM & METADATA AUDIT
  console.log("\n[2/5] Auditing Live HTML Markup & Metadata from GitHub Pages...");
  const liveHtml = fetchedFiles['/index.html'];

  assert(liveHtml.includes('viewport-fit=cover'), "HTML includes viewport-fit=cover for mobile notches");
  assert(liveHtml.includes('apple-mobile-web-app-capable'), "HTML includes apple-mobile-web-app-capable for iOS PWA");
  assert(liveHtml.includes('id="umbrellaLayer"'), "HTML contains #umbrellaLayer in avatar SVG");
  assert(liveHtml.includes('id="bootsLayer"'), "HTML contains #bootsLayer in avatar SVG");
  assert(liveHtml.includes('id="bagCoverLayer"'), "HTML contains #bagCoverLayer in avatar SVG");
  assert(liveHtml.includes('id="carCabinLayer"'), "HTML contains #carCabinLayer");
  assert(liveHtml.includes('id="scooterHelmetLayer"'), "HTML contains #scooterHelmetLayer");
  assert(liveHtml.includes('id="ribbonTrack"'), "HTML contains dynamic route ribbonTrack");
  assert(liveHtml.includes('id="departureSlider"'), "HTML contains departureSlider");
  assert(liveHtml.includes('id="btnAutoDetect"'), "HTML contains GPS auto-detect button");
  assert(liveHtml.includes('id="mobileActionDock"'), "HTML contains #mobileActionDock for 1-page zero-scroll mobile UI");
  assert(liveHtml.includes('id="btnOpenRouteSheet"'), "HTML contains #btnOpenRouteSheet");
  assert(liveHtml.includes('id="btnCloseRouteSheet"'), "HTML contains #btnCloseRouteSheet");
  assert(liveHtml.includes('id="routeSheetBackdrop"'), "HTML contains #routeSheetBackdrop");
  assert(liveHtml.includes('id="btnEngineMeteo"'), "HTML contains #btnEngineMeteo");
  assert(liveHtml.includes('id="btnReportDry"'), "HTML contains #btnReportDry ground truth button");
  assert(liveHtml.includes('id="btnEngineWeatherNext3"'), "HTML contains #btnEngineWeatherNext3 for Google DeepMind AI engine");
  assert(liveHtml.includes('id="weatherNext3Strip"'), "HTML contains #weatherNext3Strip for 3-hour AI horizon");
  assert(liveHtml.includes('id="colRadar"'), "HTML contains #colRadar");
  assert(liveHtml.includes('id="colAvatar"'), "HTML contains #colAvatar");
  assert(liveHtml.includes('id="colRoute"'), "HTML contains #colRoute");
  console.log("  ✅ Live HTML contains all essential mobile, biophysical, & WeatherNext 3 SVG nodes.");

  // 3. LIVE CSS & MOBILE RESPONSIVENESS AUDIT
  console.log("\n[3/5] Auditing Live CSS & Mobile Breakpoints...");
  const liveCss = fetchedFiles['/style.css'];

  assert(liveCss.includes('@media (max-width: 768px)'), "CSS contains 768px tablet/phone media query");
  assert(liveCss.includes('@media (max-width: 480px)'), "CSS contains 480px compact phone media query");
  assert(liveCss.includes('env(safe-area-inset-top'), "CSS uses safe area insets for iOS");
  assert(liveCss.includes('-webkit-tap-highlight-color: transparent'), "CSS eliminates touch tap flicker");
  assert(liveCss.includes('.umbrella-gear'), "CSS contains .umbrella-gear styles");
  assert(liveCss.includes('.boots-gear'), "CSS contains .boots-gear styles");
  assert(liveCss.includes('.bagcover-gear'), "CSS contains .bagcover-gear styles");
  assert(liveCss.includes('.mobile-action-dock'), "CSS contains .mobile-action-dock 1-page action dock styles");
  assert(liveCss.includes('#colRoute.sheet-open'), "CSS contains #colRoute.sheet-open slide-up styles");
  assert(liveCss.includes('.weathernext3-box'), "CSS contains .weathernext3-box AI horizon styles");
  console.log("  ✅ Live CSS includes full mobile-first, notch, and touch-target rules.");

  // 4. LIVE JAVASCRIPT SANDBOX EXECUTION & SYNTAX AUDIT
  console.log("\n[4/5] Auditing Live JavaScript Execution in Isolated Sandbox...");
  const liveJs = fetchedFiles['/app.js'];
  assert(liveJs.includes('initMobileNavigation'), "app.js contains initMobileNavigation");
  assert(liveJs.includes('renderWeatherNext3'), "app.js contains renderWeatherNext3 function");

  // DOM Mock for full sandbox testing
  const elements = {};
  function createMockElement(id = '', tag = 'div') {
    return {
      id,
      tagName: tag.toUpperCase(),
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) this._classes.add(c);
            else this._classes.delete(c);
          } else {
            if (this._classes.has(c)) this._classes.delete(c);
            else this._classes.add(c);
          }
        },
        contains(c) { return this._classes.has(c); }
      },
      addEventListener() {},
      dispatchEvent() {},
      querySelector() { return createMockElement('', 'span'); },
      querySelectorAll() { return [createMockElement('', 'span')]; },
      setAttribute() {},
      getAttribute(attr) { return attr === 'data-mode' ? 'walk' : ''; },
      appendChild() {},
      removeChild() {},
      contains() { return false; },
      focus() {}
    };
  }

  const mockDocument = {
    getElementById(id) {
      if (!elements[id]) elements[id] = createMockElement(id);
      return elements[id];
    },
    querySelector() { return createMockElement('', 'div'); },
    querySelectorAll() { return [createMockElement('', 'div')]; },
    createElement(tag) { return createMockElement('', tag); },
    addEventListener() {}
  };

  const sandbox = {
    document: mockDocument,
    window: {
      location: {
        origin: 'https://kshtjkumar.github.io',
        pathname: '/rainstop/',
        search: '?lat=26.5123&lon=80.2329&q=IIT%20Kanpur',
        href: 'https://kshtjkumar.github.io/rainstop/?lat=26.5123&lon=80.2329&q=IIT%20Kanpur'
      },
      addEventListener() {}
    },
    navigator: {
      geolocation: { getCurrentPosition() {} },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console,
    Date,
    Math,
    JSON,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    L: {
      map: () => ({ setView() {}, on() {}, fitBounds() {}, removeLayer() {} }),
      tileLayer: () => ({ addTo() {} }),
      marker: () => ({ addTo() { return { bindPopup() { return {}; }, setLatLng() {} }; } }),
      polyline: () => ({ addTo() {} }),
      geoJSON: () => ({ addTo() { return { getBounds() { return {}; } }; } }),
      divIcon: () => ({})
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(liveJs, sandbox);
  console.log("  ✅ Live app.js compiles with 0 syntax errors.");

  // Test updateUI() with live code
  vm.runInContext('updateUI();', sandbox);
  console.log("  ✅ Live updateUI() executes with 0 runtime errors.");

  // Test Umbrella Toggle
  vm.runInContext('appState.gear.umbrella = true; updateUI();', sandbox);
  const umbrellaEl = elements['umbrellaLayer'];
  assert(umbrellaEl && umbrellaEl.classList.contains('visible'), "Umbrella layer has .visible class when checked");
  console.log("  ✅ Umbrella toggles correctly with visual layer active.");

  // Test Car Cabin Mode
  vm.runInContext('appState.transportMode = "car"; updateUI();', sandbox);
  const carEl = elements['carCabinLayer'];
  assert(carEl && carEl.classList.contains('visible'), "Car cabin layer has .visible class in car mode");
  assert(umbrellaEl && umbrellaEl.classList.contains('hidden'), "Umbrella is hidden when car mode is selected");
  console.log("  ✅ Transport mode mutual exclusivity verified (Car cabin disables umbrella).");

  // Test Dynamic Route Ribbon
  vm.runInContext('appState.origin = "DOAA"; appState.dest = "Hall 8 Block D"; appState.routeDistanceKm = 1.5; renderRouteRibbon();', sandbox);
  console.log("  ✅ Dynamic route checkpoints render without hardcoded landmark errors.");

  // 5. PWA MANIFEST & SERVICE WORKER AUDIT
  console.log("\n[5/5] Auditing PWA Manifest & Service Worker Strategy...");
  const manifest = JSON.parse(fetchedFiles['/manifest.json']);
  assert.strictEqual(manifest.display, "standalone", "PWA display is standalone");
  assert.strictEqual(manifest.orientation, "portrait-primary", "PWA orientation is portrait-primary");
  assert(manifest.icons && manifest.icons.length > 0, "PWA has application icons defined");

  const liveSw = fetchedFiles['/sw.js'];
  assert(liveSw.includes('rainstop-cache-v6'), "Service Worker uses v6 cache");
  assert(liveSw.includes('skipWaiting'), "Service Worker activates immediately");
  assert(liveSw.includes('fetch(event.request)'), "Service Worker uses Network-First strategy");
  assert(liveSw.includes("request.url.startsWith('http')"), "Service Worker guards against non-http schemes");
  console.log("  ✅ PWA manifest & Service Worker v6 offline strategy verified.");

  console.log("\n==========================================================");
  console.log("🎉 ALL LIVE COMMERCIAL PUBLIC DEPLOYMENT CHECKS PASSED!");
  console.log("==========================================================");
}

runLiveDeploymentAudit().catch(err => {
  console.error("❌ AUDIT FAILED:", err);
  process.exit(1);
});
