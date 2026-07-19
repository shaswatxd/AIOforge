/** Canonical schema, mirrored in migrations/001_init.sql for reference/documentation.
 *  Loaded directly (not read from disk) so it survives the electron-builder packaging step. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS installed_apps (
  app_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  source TEXT NOT NULL,
  install_path TEXT
);

CREATE TABLE IF NOT EXISTS install_history (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS queue_items (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  speed_bps INTEGER NOT NULL DEFAULT 0,
  eta_seconds INTEGER,
  downloaded_bytes INTEGER,
  total_bytes INTEGER,
  error TEXT,
  options_json TEXT,
  item_order INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT,
  apps_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  share_code TEXT,
  is_builtin INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS favorites (
  app_id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_profiles_cache (
  code TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  cached_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applied_tweaks (
  tweak_id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`
