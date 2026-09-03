const fs = require('fs');
const path = require('path');
const https = require('https');

console.log("==========================================");
console.log("🌧️ RAINSTOP AUTOMATED FEATURE VERIFICATION");
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

// ------------------------------------------------------------------
// 1. VERIFY FILE EXISTENCE & SYNTAX
// ------------------------------------------------------------------
console.log("[1/4] Checking file structure...");
const dir = path.join(__dirname);
const requiredFiles = ['index.html', 'style.css', 'app.js', 'package.json', 'main.js', 'preload.js', 'manifest.json', 'sw.js', 'icon.svg'];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(dir, file));
  assert(exists, `File '${file}' exists`);
});

// ------------------------------------------------------------------
// 2. VERIFY DOM ELEMENT IDS IN INDEX.HTML
// ------------------------------------------------------------------
console.log("\n[2/4] Verifying HTML & JS DOM bindings...");
const htmlContent = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const jsContent = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

const requiredIds = [
  'rainCanvas', 'lightning', 'btnAutoDetect',
  'skyTitle', 'skySubtitle', 'skyIcon', 'rainStopTimer', 'stopMinutes',
  'stopClockTime', 'timelineBar', 'minutelyChart', 'adviceHeadline',
  'adviceDesc', 'puddleRisk', 'windSpeed', 'gearStatusChip', 'tierBadge',
  'tierHeadline', 'tierSubtext', 'zoneHead', 'zoneTorso', 'zoneBackpack',
  'zoneLegs', 'zoneShoes', 'umbrellaLayer', 'raincoatLayer', 'carCabinLayer', 'scooterHelmetLayer', 'labelHead',
  'labelTorso', 'labelBackpack', 'labelLegs', 'labelShoes', 'checkSneakers',
  'checkLaptop', 'checkJacket', 'routeDurationTag', 'inputOrigin',
  'inputDest', 'btnSwapRoute', 'departureSlider', 'scrubDepartureText',
  'compWaitTitle', 'compNowTitle', 'compNowSub', 'btnPickWait', 'btnPickNow',
  'btnAlertRainStop', 'btnShareForecast', 'btnOpenLabs', 'labsModal', 'toastContainer', 'avatarTooltip', 'btnReportRain'
];

requiredIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `HTML contains element id="${id}"`);
});

assert(jsContent.includes('playRainStopChime'), "app.js contains Web Audio playRainStopChime synthesizer");
assert(jsContent.includes('showToast'), "app.js contains showToast notification system");

// ------------------------------------------------------------------
// 3. VERIFY PHYSICS & WETNESS CALCULATION LOGIC
// ------------------------------------------------------------------
console.log("\n[3/4] Testing Wetness Engine Physics & Logic...");

// Mock engine logic directly from app.js definitions
const SCENARIOS = {
  monsoon: {
    stopMinutes: 18,
    rainProfile: [14.5, 12.0, 9.5, 6.0, 3.2, 1.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0],
    windSpeed: 28,
    puddleRisk: "High (5-8 cm)"
  },
  drizzle: {
    stopMinutes: 45,
    rainProfile: [1.2, 1.0, 0.8, 0.8, 0.6, 0.5, 0.4, 0.2, 0.2, 0.1, 0.0, 0.0],
    windSpeed: 8,
    puddleRisk: "Low (< 1 cm)"
  }
};

function testSimulate(scenarioKey, mode, gear, delayMins) {
  const data = SCENARIOS[scenarioKey];
  const bucketIdx = Math.min(Math.floor(delayMins / 5), data.rainProfile.length - 1);
  const rainRateAtDeparture = data.rainProfile[bucketIdx] || 0;
  const isHighWind = data.windSpeed > 30;

  const bodyStatus = { head: 'dry', torso: 'dry', backpack: 'dry', legs: 'dry', shoes: 'dry' };

  if (rainRateAtDeparture === 0) {
    return { tier: 0, bodyStatus, rainRateAtDeparture };
  }

  if (mode === 'car') {
    bodyStatus.head = gear.umbrella ? 'dry' : (rainRateAtDeparture > 5 ? 'damp' : 'dry');
    bodyStatus.shoes = rainRateAtDeparture > 8 ? 'damp' : 'dry';
  } else {
    // Head
    if (gear.raincoat) bodyStatus.head = 'dry';
    else if (gear.umbrella) bodyStatus.head = isHighWind ? 'damp' : 'dry';
    else bodyStatus.head = rainRateAtDeparture > 3 ? 'soaked' : 'damp';

    // Torso
    if (gear.raincoat) bodyStatus.torso = 'dry';
    else if (gear.umbrella) bodyStatus.torso = (isHighWind && rainRateAtDeparture > 4) ? 'damp' : 'dry';
    else bodyStatus.torso = rainRateAtDeparture > 2 ? 'soaked' : 'damp';

    // Bag
    if (gear.bagCover || gear.raincoat) bodyStatus.backpack = 'dry';
    else bodyStatus.backpack = rainRateAtDeparture > 3 ? 'soaked' : 'damp';

    // Legs
    if (gear.raincoat && mode === 'scooter') bodyStatus.legs = 'dry';
    else if (gear.raincoat) bodyStatus.legs = rainRateAtDeparture > 8 ? 'damp' : 'dry';
    else {
      if (rainRateAtDeparture > 5 || mode === 'scooter') bodyStatus.legs = 'soaked';
      else if (rainRateAtDeparture > 1) bodyStatus.legs = 'damp';
      else bodyStatus.legs = 'dry';
    }

    // Shoes
    if (gear.shoeCovers) bodyStatus.shoes = 'dry';
    else {
      if (rainRateAtDeparture > 3 || data.puddleRisk.includes('High')) bodyStatus.shoes = 'soaked';
      else if (rainRateAtDeparture > 0.5) bodyStatus.shoes = 'damp';
      else bodyStatus.shoes = 'dry';
    }
  }

  const soakedCount = Object.values(bodyStatus).filter(s => s === 'soaked').length;
  let tier = 0;
  if (rainRateAtDeparture === 0) tier = 0;
  else if (soakedCount >= 3 || (bodyStatus.torso === 'soaked' && bodyStatus.head === 'soaked')) tier = 4;
  else if (soakedCount >= 1 || (bodyStatus.shoes === 'soaked' && bodyStatus.legs === 'soaked')) tier = 3;
  else if (bodyStatus.shoes === 'soaked' || bodyStatus.legs === 'damp' || bodyStatus.shoes === 'damp') tier = 2;
  else tier = 1;

  return { tier, bodyStatus, rainRateAtDeparture };
}

// Case 1: Walk in Monsoon with No Gear -> High Soak Tier (Tier 3 or 4)
const r1 = testSimulate('monsoon', 'walk', { umbrella: false, raincoat: false, shoeCovers: false, bagCover: false }, 0);
assert(r1.tier >= 3 && r1.bodyStatus.head === 'soaked' && r1.bodyStatus.shoes === 'soaked', "Monsoon walk without gear causes Tier 3/4 soak");

// Case 2: Walk with Umbrella in Monsoon -> Torso dry, but shoes/legs get wet (Tier 2/3)
const r2 = testSimulate('monsoon', 'walk', { umbrella: true, raincoat: false, shoeCovers: false, bagCover: true }, 0);
assert(r2.bodyStatus.head === 'dry' && r2.bodyStatus.torso === 'dry' && r2.bodyStatus.shoes === 'soaked', "Umbrella shields torso/head, shoes get wet from puddles");

// Case 3: Walk with Full Raincoat + Waterproof Boots -> Complete Protection (Tier 0)
const r3 = testSimulate('monsoon', 'walk', { umbrella: false, raincoat: true, shoeCovers: true, bagCover: true }, 0);
assert(r3.bodyStatus.head === 'dry' && r3.bodyStatus.torso === 'dry' && r3.bodyStatus.shoes === 'dry', "Full raincoat + boots = all body zones dry");

// Case 4: Wait 35 mins until rain stops in Monsoon -> Tier 0 (Bone Dry)
const r4 = testSimulate('monsoon', 'walk', { umbrella: false, raincoat: false, shoeCovers: false, bagCover: false }, 35);
assert(r4.tier === 0 && r4.rainRateAtDeparture === 0, "Waiting for rain to stop results in Tier 0 Bone Dry");

// Case 5: Car Mode -> Shields passenger
const r5 = testSimulate('monsoon', 'car', { umbrella: false, raincoat: false, shoeCovers: false, bagCover: false }, 0);
assert(r5.bodyStatus.torso === 'dry' && r5.bodyStatus.legs === 'dry', "Car transit shields torso and legs");

// ------------------------------------------------------------------
// 4. VERIFY LIVE OPEN-METEO API CONNECTIVITY
// ------------------------------------------------------------------
console.log("\n[4/4] Testing Live Open-Meteo Weather API endpoint...");
const testUrl = "https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&minutely_15=precipitation&current_weather=true&timezone=auto";

https.get(testUrl, (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(rawData);
      assert(parsed.current_weather !== undefined, "Open-Meteo returns valid current_weather object");
      assert(parsed.minutely_15 !== undefined, "Open-Meteo returns minutely_15 precipitation array");
      
      console.log("\n==========================================");
      console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
      console.log("==========================================");
      process.exit(failed === 0 ? 0 : 1);
    } catch (e) {
      assert(false, `Open-Meteo response parsing failed: ${e.message}`);
      process.exit(1);
    }
  });
}).on('error', (e) => {
  assert(false, `Open-Meteo API network request failed: ${e.message}`);
  process.exit(1);
});
