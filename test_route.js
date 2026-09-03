const fs = require('fs');
const path = require('path');
const https = require('https');

console.log("==========================================");
console.log("🌧️ LEAFLET MAP & PHOTON GPS TEST SUITE");
console.log("==========================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

const dir = path.join(__dirname);
const htmlContent = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const jsContent = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

// 1. Check HTML elements
assert(htmlContent.includes('leaflet@1.9.4'), "HTML includes Leaflet CDN stylesheet & scripts");
assert(htmlContent.includes('id="routeMap"'), "HTML contains routeMap container");
assert(htmlContent.includes('id="gpsEngineChip"'), "HTML contains GPS Engine badge");
assert(!htmlContent.includes('id="gmapsModal"'), "HTML has removed Google Maps modal cleanly");

// 2. Check JS functions
assert(jsContent.includes('initInteractiveMap'), "app.js contains initInteractiveMap");
assert(jsContent.includes('setupPhotonAutocomplete'), "app.js contains setupPhotonAutocomplete");
assert(jsContent.includes('fetchAndDrawRoute'), "app.js contains fetchAndDrawRoute");
assert(!jsContent.includes('google.maps'), "app.js has zero Google Maps SDK dependencies");

// 3. Test Photon live API
const testUrl = "https://photon.komoot.io/api/?q=IIT+Kanpur&lat=26.5123&lon=80.2329&limit=3";
const options = { headers: { 'User-Agent': 'RainStopTest/1.0' } };

https.get(testUrl, options, (res) => {
  let raw = '';
  res.on('data', c => raw += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(raw);
      assert(json.features && json.features.length > 0, `Photon returned ${json.features.length} live place predictions`);
      console.log("\n==========================================");
      console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
      console.log("==========================================");
      process.exit(failed === 0 ? 0 : 1);
    } catch (err) {
      assert(false, `Photon JSON parse failed: ${err.message}`);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  assert(false, `Photon request failed: ${err.message}`);
  process.exit(1);
});
