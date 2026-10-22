const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log('   STAGE 6: AMAZON FIRE TV APPSTORE COMPLIANCE & SUBMISSION AUDIT     ');
console.log('======================================================================\n');

let passed = 0;
let failed = 0;

function runTest(id, name, testFn) {
  try {
    testFn();
    console.log(`[PASS] (${id}) ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] (${id}) ${name}`);
    console.error(`       Error: ${err.message}`);
    failed++;
  }
}

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

// 1. LEANBACK LAUNCHER
runTest('APPSTORE-001', 'Leanback Launcher Intent Category Declared', () => {
  assert.ok(
    manifestContent.includes('android.intent.category.LEANBACK_LAUNCHER'),
    'AndroidManifest.xml must include android.intent.category.LEANBACK_LAUNCHER'
  );
});

// 2. TOUCHSCREEN NOT REQUIRED
runTest('APPSTORE-002', 'Touchscreen Hardware Not Required (android:required="false")', () => {
  assert.ok(
    manifestContent.includes('android:name="android.hardware.touchscreen" android:required="false"'),
    'Touchscreen must be optional for Fire TV remote-only operation'
  );
});

// 3. FAKETOUCH NOT REQUIRED
runTest('APPSTORE-003', 'FakeTouch Hardware Not Required (android:required="false")', () => {
  assert.ok(
    manifestContent.includes('android:name="android.hardware.faketouch" android:required="false"'),
    'FakeTouch must be optional for TV remote compatibility'
  );
});

// 4. LEANBACK SOFTWARE DECLARED
runTest('APPSTORE-004', 'Leanback Software Feature Declared (android:required="false")', () => {
  assert.ok(
    manifestContent.includes('android:name="android.software.leanback" android:required="false"'),
    'software.leanback must be declared with required="false" for dual compatibility'
  );
});

// 5. BANNER DECLARED ON APPLICATION
runTest('APPSTORE-005', 'Leanback Home Banner Declared on Application Element', () => {
  assert.ok(
    manifestContent.includes('android:banner="@drawable/tv_banner"'),
    'Application element must declare android:banner="@drawable/tv_banner"'
  );
});

// 6. PROHIBITED HARDWARE AUDIT
runTest('APPSTORE-006', 'Zero Non-TV Hardware Requirements (Camera, GPS, Telephony)', () => {
  const prohibited = [
    'android.hardware.camera',
    'android.hardware.telephony',
    'android.hardware.location.gps',
    'android.hardware.nfc',
    'android.hardware.sensor.compass',
  ];
  for (const feat of prohibited) {
    if (manifestContent.includes(`android:name="${feat}"`)) {
      assert.ok(
        manifestContent.includes(`android:name="${feat}" android:required="false"`),
        `Prohibited feature ${feat} must have android:required="false"`
      );
    }
  }
});

// 7. TV BANNER ASSET RESOLUTION & ASPECT RATIO
runTest('APPSTORE-007', 'Leanback TV Banner Asset Exists with Valid Dimensions', () => {
  const bannerPath = path.join(rootDir, 'android/app/src/main/res/drawable/tv_banner.png');
  assert.ok(fs.existsSync(bannerPath), 'tv_banner.png must exist in res/drawable');
  
  const buf = fs.readFileSync(bannerPath);
  assert.strictEqual(buf.slice(0, 8).toString('hex'), '89504e470d0a1a0a', 'Must be a valid PNG');
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  assert.ok(w >= 320, `Banner width ${w} must be >= 320px`);
  assert.ok(h >= 180, `Banner height ${h} must be >= 180px`);
  const ratio = w / h;
  assert.ok(ratio >= 1.5 && ratio <= 1.85, `Banner aspect ratio ${ratio.toFixed(2)} must be ~16:9 / 1.66`);
});

// 8. APP MIPMAP ICONS ACROSS DENSITIES
runTest('APPSTORE-008', 'App Mipmap Launcher Icons Present for All Screen Densities', () => {
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  for (const d of densities) {
    const iconPath = path.join(rootDir, `android/app/src/main/res/mipmap-${d}/ic_launcher.webp`);
    assert.ok(fs.existsSync(iconPath), `ic_launcher.webp missing for density ${d}`);
  }
});

// 9. REMOTE NAVIGATION COMPLETENESS: AI DJ & FAVORITES
runTest('APPSTORE-009', 'Remote Spatial Navigation: AI DJ & Favorites Graphs Integrity', () => {
  const aiDjContent = fs.readFileSync(path.join(rootDir, 'src/navigation/aiDjNavGraph.ts'), 'utf8');
  assert.ok(aiDjContent.includes('function getAiDjNextFocus'), 'Must define getAiDjNextFocus');
  assert.ok(aiDjContent.includes('AI_DJ_FOCUS_IDS'), 'Must export AI_DJ_FOCUS_IDS');

  const favContent = fs.readFileSync(path.join(rootDir, 'src/navigation/favoritesNavGraph.ts'), 'utf8');
  assert.ok(favContent.includes('function getFavoritesNextFocus'), 'Must define getFavoritesNextFocus');
  assert.ok(favContent.includes('FAVORITES_FOCUS_IDS'), 'Must export FAVORITES_FOCUS_IDS');
});

// 10. REMOTE NAVIGATION COMPLETENESS: LIBRARY
runTest('APPSTORE-010', 'Remote Spatial Navigation: Library Navigation Graph with USB', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/navigation/libraryNavGraph.ts'), 'utf8');
  assert.ok(content.includes('function getLibraryNextFocus'), 'Must define getLibraryNextFocus');
  assert.ok(content.includes('LIBRARY_CARD_IDS'), 'Must export LIBRARY_CARD_IDS');
  assert.ok(content.includes('USB:'), 'Must include USB row focus');
});

// 11. REMOTE NAVIGATION COMPLETENESS: SEARCH ON-SCREEN KEYBOARD
runTest('APPSTORE-011', 'Remote Spatial Navigation: Search Grid Keyboard 7x5 Layout', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/navigation/searchNavGraph.ts'), 'utf8');
  assert.ok(content.includes('function getSearchNextFocus'), 'Must define getSearchNextFocus');
  assert.ok(content.includes('KEYBOARD_ROWS'), 'Must export KEYBOARD_ROWS');
  assert.ok(content.includes('KEY_SPACE') && content.includes('KEY_DEL') && content.includes('KEY_SEARCH'), 'Must include bottom action keys');
});

// 12. REMOTE NAVIGATION COMPLETENESS: SETTINGS & PRIVACY
runTest('APPSTORE-012', 'Remote Spatial Navigation: Settings Companion & Privacy Graph', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/navigation/settingsNavGraph.ts'), 'utf8');
  assert.ok(content.includes('function getSettingsNextFocus'), 'Must define getSettingsNextFocus');
  assert.ok(content.includes('SETTINGS_FOCUS_IDS'), 'Must export SETTINGS_FOCUS_IDS');
  assert.ok(content.includes('CHANGE_AVATAR') && content.includes('QR_CARD'), 'Must link avatar and privacy QR card');
});

// 13. AUDIO FOCUS & BACKGROUND AUDIO SERVICE DECLARATION
runTest('APPSTORE-013', 'Audio Focus & Foreground Audio Capabilities Declared', () => {
  assert.ok(manifestContent.includes('android.permission.MODIFY_AUDIO_SETTINGS'), 'Must declare MODIFY_AUDIO_SETTINGS');
  assert.ok(manifestContent.includes('android.permission.INTERNET'), 'Must declare INTERNET for streaming');
});

// 14. DATA SAFETY & PRIVACY DISCLOSURE AUDIT
runTest('APPSTORE-014', 'Zero Passive Microphone Listening Policy & Local Storage Only', () => {
  const settingsScreenPath = path.join(rootDir, 'src/components/SettingsScreen.tsx');
  const settingsContent = fs.readFileSync(settingsScreenPath, 'utf8');
  assert.ok(settingsContent.includes('Zero Passive Listening'), 'Must disclose zero passive listening');
  assert.ok(settingsContent.includes('SQLite'), 'Must disclose local SQLite storage');
  assert.ok(settingsContent.includes('on-device'), 'Must emphasize on-device privacy guarantee');
});

// 15. IMMERSIVE FULLSCREEN NAVIGATION & THEME PALETTE
runTest('APPSTORE-015', 'Remote Spatial Navigation: Fullscreen Player & Motion Video Selectors', () => {
  const fsNavContent = fs.readFileSync(path.join(rootDir, 'src/navigation/fullscreenNavGraph.ts'), 'utf8');
  assert.ok(fsNavContent.includes('function getFullscreenNextFocus'), 'Must define getFullscreenNextFocus');
  assert.ok(fsNavContent.includes('FULLSCREEN_FOCUS_IDS'), 'Must export FULLSCREEN_FOCUS_IDS');
});

console.log('\n======================================================================');
console.log(`TOTAL COMPLIANCE AUDITS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
}
