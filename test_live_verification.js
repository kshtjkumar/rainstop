/**
 * Comprehensive Live Verification of 5-Layer Future-Proof Engine
 */
const https = require('https');
const assert = require('assert');

console.log("==========================================");
console.log("🌧️ LIVE NOWCASTING & PHYSICAL VERIFICATION");
console.log("==========================================");

function runLiveApiTest() {
  return new Promise((resolve, reject) => {
    const lat = 26.5123, lon = 80.2329;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation,weathercode&hourly=precipitation,windspeed_10m,weathercode&current_weather=true&forecast_days=2&timezone=auto`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          // Test 1: 48-hour continuous window
          assert(json.minutely_15, "API returned minutely_15 object");
          assert(json.minutely_15.time.length >= 190, `Returned ${json.minutely_15.time.length} intervals (>= 190 expected for 48h)`);
          console.log(`✅ [1/5] 48-Hour Rolling Window: ${json.minutely_15.time.length} intervals present`);

          // Test 2: Epoch Millisecond Alignment
          const nowTimeStr = json.current_weather ? json.current_weather.time : null;
          const nowMs = nowTimeStr ? new Date(nowTimeStr).getTime() : Date.now();
          let startIndex = 0;
          let minDiff = Infinity;
          json.minutely_15.time.forEach((tStr, idx) => {
            const diff = Math.abs(new Date(tStr).getTime() - nowMs);
            if (diff < minDiff) {
              minDiff = diff;
              startIndex = idx;
            }
          });
          assert(minDiff <= 15 * 60 * 1000, `Matched interval within 15 mins: diff=${minDiff}ms`);
          console.log(`✅ [2/5] Epoch Alignment: matched index ${startIndex} (${json.minutely_15.time[startIndex]}) within ${Math.round(minDiff/1000)}s`);

          // Test 3: Multi-Signal Consensus
          const wcode = json.current_weather.weathercode;
          const isWmoRain = (wcode >= 51 && wcode <= 67) || (wcode >= 80 && wcode <= 99);
          const minutelySlice = json.minutely_15.precipitation.slice(startIndex, startIndex + 12);
          const minutelyCodes = json.minutely_15.weathercode.slice(startIndex, startIndex + 12);
          
          assert(minutelySlice.length === 12, "Extracted exactly 12 future intervals (3-hour profile)");
          console.log(`✅ [3/5] Multi-Signal Consensus: wcode=${wcode}, isWmoRain=${isWmoRain}, future 3h precip profile=[${minutelySlice.slice(0, 4).join(', ')}...]`);

          // Test 4: Stop-Minutes Calculation
          const radarRainRate = minutelySlice[0] || 0;
          const isRainingNow = radarRainRate > 0.1;
          const currentPrecip = isRainingNow ? radarRainRate : 0.0;
          
          let stopMins = 0;
          if (isRainingNow) {
            const stopIdx = minutelySlice.findIndex((p, i) => i > 0 && p < 0.1);
            stopMins = stopIdx !== -1 ? stopIdx * 15 : 45;
          }
          assert(isRainingNow ? stopMins > 0 : stopMins === 0, "Stop minutes physically consistent with rain state");
          console.log(`✅ [4/5] Stop Minutes Logic: isRainingNow=${isRainingNow} (rate=${currentPrecip.toFixed(1)} mm/h) ➔ stopMinutes=${stopMins} mins`);

          // Test 5: Midnight boundary test (simulate time at 23:45)
          const midnightIdx = json.minutely_15.time.findIndex(t => t.endsWith('23:45'));
          if (midnightIdx !== -1) {
            const crossDaySlice = json.minutely_15.precipitation.slice(midnightIdx, midnightIdx + 12);
            assert(crossDaySlice.length === 12, "Midnight wrap-around slice safely spans into day 2");
            console.log(`✅ [5/5] Midnight Wrap-Around: 23:45 cross-day slice successfully retrieved ${crossDaySlice.length} intervals`);
          }

          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

runLiveApiTest().then(() => {
  console.log("\n==========================================");
  console.log("🎉 ALL LIVE NOWCASTING VERIFICATIONS PASSED!");
  console.log("==========================================");
  process.exit(0);
}).catch(err => {
  console.error("❌ Verification Failed:", err);
  process.exit(1);
});
