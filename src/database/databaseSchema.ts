/**
 * Fire TV Music Database Schema (SQLite / WAL Mode)
 * Defines tables, indexes, and initialization DDL for:
 * 1. Playback History (Recently Played)
 * 2. Search History (Recent Searches)
 * 3. Liked Songs
 * 4. Liked Playlists
 * 5. AI DJ Playlists
 */

export const SCHEMA_DDL = `
-- Enable Write-Ahead Logging for high-throughput 60 FPS reads/writes
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. Playback History Table
CREATE TABLE IF NOT EXISTS playback_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  context TEXT
);

CREATE INDEX IF NOT EXISTS idx_playback_history_played_at ON playback_history (played_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_history_track_id ON playback_history (track_id);

-- 2. Search History Table (Distinct queries with updated timestamps)
CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL UNIQUE,
  searched_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history (searched_at DESC);

-- 3. Liked Songs Table
CREATE TABLE IF NOT EXISTS liked_songs (
  track_id TEXT PRIMARY KEY,
  liked_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_liked_songs_liked_at ON liked_songs (liked_at DESC);

-- 4. Liked Playlists Table
CREATE TABLE IF NOT EXISTS liked_playlists (
  playlist_id TEXT PRIMARY KEY,
  liked_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_liked_playlists_liked_at ON liked_playlists (liked_at DESC);

-- 5. AI DJ Generated Playlists Table
CREATE TABLE IF NOT EXISTS ai_dj_playlists (
  session_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  user_prompt TEXT,
  mood TEXT,
  track_ids_json TEXT NOT NULL,
  cover_image_key TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_dj_playlists_created_at ON ai_dj_playlists (created_at DESC);

-- 6. App Metadata Table
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 7. User Preferences / Avatar Selection Table
CREATE TABLE IF NOT EXISTS user_preferences (
  pref_key TEXT PRIMARY KEY,
  pref_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

