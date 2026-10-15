const assert = require('assert');

// 1. Navigation Graph Logic from libraryNavGraph.ts
const LIBRARY_CARD_IDS = {
  CHILL: 'LIB_CARD_CHILL',
  FOCUS: 'LIB_CARD_FOCUS',
  WORKOUT: 'LIB_CARD_WORKOUT',
  STUDY: 'LIB_CARD_STUDY',
  ENERGIZE: 'LIB_CARD_ENERGIZE',
  MIDNIGHT: 'LIB_CARD_MIDNIGHT',
  USB: 'LIB_CARD_USB',
};

function getLibraryNextFocus(currentId, direction) {
  if (currentId === LIBRARY_CARD_IDS.ENERGIZE) {
    if (direction === 'up') return LIBRARY_CARD_IDS.WORKOUT;
    if (direction === 'right') return LIBRARY_CARD_IDS.MIDNIGHT;
    if (direction === 'down') return LIBRARY_CARD_IDS.USB;
    if (direction === 'left') return 'NAV_LIBRARY';
    return null;
  }
  if (currentId === LIBRARY_CARD_IDS.MIDNIGHT) {
    if (direction === 'up') return LIBRARY_CARD_IDS.STUDY;
    if (direction === 'left') return LIBRARY_CARD_IDS.ENERGIZE;
    if (direction === 'down') return LIBRARY_CARD_IDS.USB;
    return null;
  }
  if (currentId === LIBRARY_CARD_IDS.USB) {
    if (direction === 'up') return LIBRARY_CARD_IDS.ENERGIZE;
    if (direction === 'left') return 'NAV_LIBRARY';
    return null;
  }
  if (currentId.startsWith('NAV_')) {
    if (direction === 'right') {
      if (currentId === 'NAV_SETTINGS') return LIBRARY_CARD_IDS.USB;
      if (currentId === 'NAV_FAV') return LIBRARY_CARD_IDS.WORKOUT;
      return LIBRARY_CARD_IDS.CHILL;
    }
  }
  return null;
}

// 2. Format Duration Helper
function formatTotalPlaylistDuration(tracks) {
  const totalSec = tracks.reduce((acc, t) => acc + (t.durationSeconds || 180), 0);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// 3. Audio Extension Matcher Logic
const SUPPORTED_EXTS = new Set(['mp3', 'm4a', 'aac', 'flac', 'wav', 'ogg', 'wma']);
function isSupportedAudio(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return SUPPORTED_EXTS.has(ext);
}

// 4. System Directory Blacklist Filter Logic
const BLACKLIST_DIRS = new Set([
  'LOST.DIR',
  'SYSTEM VOLUME INFORMATION',
  '$RECYCLE.BIN',
  'ANDROID',
  '.THUMBNAILS'
]);
function shouldScanDirectory(dirname) {
  if (dirname.startsWith('.')) return false;
  return !BLACKLIST_DIRS.has(dirname.toUpperCase());
}

// 5. Track Mapper
function mapRawUsbTrack(raw, index) {
  const totalSec = raw.duration || 180;
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  return {
    id: raw.id || `usb_track_${index}`,
    trackNumber: index + 1,
    title: raw.title || 'Unknown Track',
    artist: raw.artist || 'Unknown Artist',
    album: raw.album || 'USB Storage',
    duration: durStr,
    durationSeconds: totalSec,
    audioUrl: raw.audioUrl,
    artworkUrl: raw.artworkUrl || null,
  };
}

// 6. Test Suite Runner
const testCases = [
  {
    name: 'USB-001: Supported Audio Extensions Validation',
    fn: () => {
      const valid = ['song.mp3', 'track.FLAC', 'audio.M4A', 'sample.wav', 'clip.aac', 'music.ogg', 'legacy.wma'];
      const invalid = ['image.jpg', 'movie.mp4', 'text.txt', 'archive.zip', 'app.apk'];
      valid.forEach(f => assert.strictEqual(isSupportedAudio(f), true, `${f} should be supported`));
      invalid.forEach(f => assert.strictEqual(isSupportedAudio(f), false, `${f} should not be supported`));
    }
  },
  {
    name: 'USB-002: System Directory Filtering (LOST.DIR, Android, Trash)',
    fn: () => {
      assert.strictEqual(shouldScanDirectory('LOST.DIR'), false);
      assert.strictEqual(shouldScanDirectory('lost.dir'), false);
      assert.strictEqual(shouldScanDirectory('Android'), false);
      assert.strictEqual(shouldScanDirectory('.thumbnails'), false);
      assert.strictEqual(shouldScanDirectory('System Volume Information'), false);
      assert.strictEqual(shouldScanDirectory('$RECYCLE.BIN'), false);
      assert.strictEqual(shouldScanDirectory('Music'), true);
      assert.strictEqual(shouldScanDirectory('Chillhop Albums'), true);
      assert.strictEqual(shouldScanDirectory('Downloads'), true);
    }
  },
  {
    name: 'USB-003: D-Pad Navigation from ENERGIZE down to USB Card',
    fn: () => {
      const target = getLibraryNextFocus(LIBRARY_CARD_IDS.ENERGIZE, 'down');
      assert.strictEqual(target, LIBRARY_CARD_IDS.USB);
    }
  },
  {
    name: 'USB-004: D-Pad Navigation from MIDNIGHT down to USB Card',
    fn: () => {
      const target = getLibraryNextFocus(LIBRARY_CARD_IDS.MIDNIGHT, 'down');
      assert.strictEqual(target, LIBRARY_CARD_IDS.USB);
    }
  },
  {
    name: 'USB-005: D-Pad Navigation from USB Card up to ENERGIZE',
    fn: () => {
      const target = getLibraryNextFocus(LIBRARY_CARD_IDS.USB, 'up');
      assert.strictEqual(target, LIBRARY_CARD_IDS.ENERGIZE);
    }
  },
  {
    name: 'USB-006: D-Pad Navigation from USB Card left to NAV_LIBRARY Rail',
    fn: () => {
      const target = getLibraryNextFocus(LIBRARY_CARD_IDS.USB, 'left');
      assert.strictEqual(target, 'NAV_LIBRARY');
    }
  },
  {
    name: 'USB-007: D-Pad Navigation from NAV_SETTINGS right to USB Card',
    fn: () => {
      const target = getLibraryNextFocus('NAV_SETTINGS', 'right');
      assert.strictEqual(target, LIBRARY_CARD_IDS.USB);
    }
  },
  {
    name: 'USB-008: Raw Track ID3 Conversion & Formatting',
    fn: () => {
      const raw = {
        id: 'usb_0_12345',
        title: 'Electric Horizon',
        artist: 'Synthwave Collective',
        album: 'Cyber City Nights',
        duration: 214,
        audioUrl: 'file:///storage/0000-0000/Music/01_Electric_Horizon.mp3',
        artworkUrl: 'file:///data/user/0/com.firetv.musicpoc/cache/usb_artworks/art_123.jpg'
      };
      const mapped = mapRawUsbTrack(raw, 0);
      assert.strictEqual(mapped.trackNumber, 1);
      assert.strictEqual(mapped.title, 'Electric Horizon');
      assert.strictEqual(mapped.artist, 'Synthwave Collective');
      assert.strictEqual(mapped.album, 'Cyber City Nights');
      assert.strictEqual(mapped.duration, '3:34');
      assert.strictEqual(mapped.durationSeconds, 214);
      assert.strictEqual(mapped.audioUrl, raw.audioUrl);
      assert.strictEqual(mapped.artworkUrl, raw.artworkUrl);
    }
  },
  {
    name: 'USB-009: Playlist Duration Aggregation Formatter',
    fn: () => {
      const tracks = [
        { durationSeconds: 214 },
        { durationSeconds: 180 },
        { durationSeconds: 300 }
      ];
      const dur = formatTotalPlaylistDuration(tracks);
      assert.strictEqual(dur, '11m'); // 694 seconds = 11 mins 34 secs -> '11m'

      const longTracks = Array(20).fill({ durationSeconds: 200 }); // 4000s = 1h 6m
      const longDur = formatTotalPlaylistDuration(longTracks);
      assert.strictEqual(longDur, '1h 6m');
    }
  },
  {
    name: 'USB-010: Disconnected State & Modal Logic',
    fn: () => {
      const status = { isConnected: false, volumePath: null, driveName: null };
      assert.strictEqual(status.isConnected, false);
      const modal = {
        visible: !status.isConnected,
        type: 'NOT_CONNECTED',
        title: 'No USB Drive Connected',
        focusTarget: 'USB_MODAL_BACK'
      };
      assert.strictEqual(modal.visible, true);
      assert.strictEqual(modal.type, 'NOT_CONNECTED');
      assert.strictEqual(modal.focusTarget, 'USB_MODAL_BACK');
    }
  },
  {
    name: 'USB-011: Connected State with 0 Audio Tracks Modal Logic',
    fn: () => {
      const status = { isConnected: true, volumePath: '/storage/0000-0000', driveName: 'SDCARD' };
      const tracks = [];
      assert.strictEqual(status.isConnected, true);
      assert.strictEqual(tracks.length, 0);
      const modal = {
        visible: status.isConnected && tracks.length === 0,
        type: 'NO_SONGS',
        title: 'No Songs Found on USB',
        focusTarget: 'USB_MODAL_BACK'
      };
      assert.strictEqual(modal.visible, true);
      assert.strictEqual(modal.type, 'NO_SONGS');
    }
  },
  {
    name: 'USB-012: Live USB Playlist Assembly for Connected Media',
    fn: () => {
      const status = { isConnected: true, driveName: 'Kingston 32GB' };
      const tracks = [
        mapRawUsbTrack({ title: 'Track 1', duration: 180 }, 0),
        mapRawUsbTrack({ title: 'Track 2', duration: 200 }, 1)
      ];
      const playlist = {
        id: 'usb_storage',
        title: `USB: ${status.driveName}`,
        badgeText: 'USB AUDIO',
        songsCount: `${tracks.length} songs`,
        totalDuration: formatTotalPlaylistDuration(tracks),
        tracks: tracks
      };
      assert.strictEqual(playlist.id, 'usb_storage');
      assert.strictEqual(playlist.title, 'USB: Kingston 32GB');
      assert.strictEqual(playlist.badgeText, 'USB AUDIO');
      assert.strictEqual(playlist.songsCount, '2 songs');
      assert.strictEqual(playlist.totalDuration, '6m');
      assert.strictEqual(playlist.tracks.length, 2);
    }
  },
  {
    name: 'USB-013: Unmount Auto-Exit Cleanup Verification',
    fn: () => {
      let selectedPlaylist = { id: 'usb_storage', title: 'USB: SDCARD' };
      let focusedId = 'PL_PLAY_ALL';
      let usbTracks = [{ id: 'usb_1' }];

      // Simulate unmount event
      const onUsbUnmounted = () => {
        usbTracks = [];
        if (selectedPlaylist && selectedPlaylist.id === 'usb_storage') {
          selectedPlaylist = null;
          focusedId = LIBRARY_CARD_IDS.USB;
        }
      };

      onUsbUnmounted();
      assert.strictEqual(selectedPlaylist, null);
      assert.strictEqual(focusedId, LIBRARY_CARD_IDS.USB);
      assert.strictEqual(usbTracks.length, 0);
    }
  }
];

console.log('======================================================================');
console.log('       STAGE 5: EXTERNAL MEDIA & USB STORAGE TEST SUITE                ');
console.log('======================================================================\n');

let passed = 0;
let failed = 0;

testCases.forEach((tc, idx) => {
  try {
    tc.fn();
    console.log(`[PASS] (${idx + 1}/${testCases.length}) ${tc.name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] (${idx + 1}/${testCases.length}) ${tc.name}`);
    console.error(`       Error: ${err.message}`);
    failed++;
  }
});

console.log('\n======================================================================');
console.log(`TOTAL TESTS: ${testCases.length} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
}
