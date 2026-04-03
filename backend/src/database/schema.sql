PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS parks (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  park_id INTEGER REFERENCES parks(id) ON DELETE SET NULL ON UPDATE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_super_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_super_admin IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS greenhouses (
  id INTEGER PRIMARY KEY,
  park_id INTEGER REFERENCES parks(id) ON DELETE SET NULL ON UPDATE CASCADE,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  zone_name TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  growth_stage TEXT NOT NULL,
  structure_type TEXT NOT NULL,
  temp REAL NOT NULL,
  humidity REAL NOT NULL,
  soil_moisture REAL NOT NULL,
  ec REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('normal', 'warning', 'offline', 'maintenance')),
  online_device_count INTEGER NOT NULL DEFAULT 0,
  irrigation_mode TEXT NOT NULL DEFAULT 'manual' CHECK (irrigation_mode IN ('manual', 'assisted', 'ai_managed')),
  last_collected_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS greenhouse_profiles (
  greenhouse_id INTEGER PRIMARY KEY REFERENCES greenhouses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  manager_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  area_sqm REAL,
  device_total_count INTEGER NOT NULL DEFAULT 0,
  device_online_count INTEGER NOT NULL DEFAULT 0,
  irrigation_strategy TEXT,
  last_service_at TEXT,
  target_temp_min REAL,
  target_temp_max REAL,
  target_humidity_min REAL,
  target_humidity_max REAL,
  target_soil_moisture_min REAL,
  target_soil_moisture_max REAL,
  target_ec_min REAL,
  target_ec_max REAL,
  notes_json TEXT NOT NULL DEFAULT '[]',
  device_state_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id INTEGER PRIMARY KEY,
  greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  recorded_at TEXT NOT NULL,
  temp REAL NOT NULL,
  humidity REAL NOT NULL,
  soil_moisture REAL NOT NULL,
  ec REAL NOT NULL,
  light_lux REAL,
  co2_ppm REAL,
  UNIQUE (greenhouse_id, recorded_at)
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY,
  greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'ignored', 'executed')),
  created_by TEXT NOT NULL DEFAULT 'ai-engine',
  acted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  acted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY,
  greenhouse_id INTEGER REFERENCES greenhouses(id) ON DELETE SET NULL ON UPDATE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('环境报警', '水肥预警', '设备报警')),
  level TEXT NOT NULL CHECK (level IN ('低', '中', '高')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
  resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
  occurred_at TEXT NOT NULL,
  resolved_at TEXT,
  resolved_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  resolution_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS irrigation_events (
  id INTEGER PRIMARY KEY,
  greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  decision_id INTEGER REFERENCES decisions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  initiated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('manual', 'rule', 'ai')),
  duration_minutes INTEGER NOT NULL,
  water_volume_m3 REAL NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS control_logs (
  id INTEGER PRIMARY KEY,
  greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  action_type TEXT NOT NULL,
  target TEXT NOT NULL,
  command TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'success', 'failed', 'cancelled')),
  requested_at TEXT NOT NULL,
  executed_at TEXT,
  result_message TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS experiments (
  id INTEGER PRIMARY KEY,
  park_id INTEGER REFERENCES parks(id) ON DELETE SET NULL ON UPDATE CASCADE,
  lead_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  greenhouse_id INTEGER REFERENCES greenhouses(id) ON DELETE SET NULL ON UPDATE CASCADE,
  name TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  treatments INTEGER NOT NULL CHECK (treatments > 0),
  replicates INTEGER NOT NULL CHECK (replicates > 0),
  status TEXT NOT NULL CHECK (status IN ('未开始', '进行中', '已归档')),
  start_date TEXT NOT NULL,
  ai_enabled INTEGER NOT NULL DEFAULT 0 CHECK (ai_enabled IN (0, 1)),
  summary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experiment_designs (
  id INTEGER PRIMARY KEY,
  experiment_id INTEGER NOT NULL UNIQUE REFERENCES experiments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  layout_json TEXT NOT NULL,
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phenotype_records (
  id INTEGER PRIMARY KEY,
  experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  sample_code TEXT NOT NULL,
  trait_name TEXT NOT NULL,
  trait_value REAL NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  recorded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_irrigation_daily (
  id INTEGER PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('park', 'greenhouse')),
  scope_ref TEXT NOT NULL,
  record_date TEXT NOT NULL,
  water_usage_m3 REAL NOT NULL,
  UNIQUE (scope_type, scope_ref, record_date)
);

CREATE TABLE IF NOT EXISTS efficiency_snapshots (
  id INTEGER PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('park', 'greenhouse')),
  scope_ref TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  score_label TEXT NOT NULL,
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  record_month TEXT NOT NULL,
  insight_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (scope_type, scope_ref, metric_key, record_month)
);

CREATE TABLE IF NOT EXISTS system_rules (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value_type TEXT NOT NULL CHECK (value_type IN ('number', 'boolean', 'text')),
  numeric_value REAL,
  boolean_value INTEGER CHECK (boolean_value IN (0, 1)),
  text_value TEXT,
  unit TEXT,
  comparison_operator TEXT,
  duration_minutes INTEGER,
  action_mode TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_services (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  endpoint TEXT,
  status TEXT NOT NULL CHECK (status IN ('connected', 'running', 'stopped', 'error')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  response_time_ms INTEGER,
  last_heartbeat_at TEXT,
  config_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  email TEXT,
  title TEXT,
  affiliation TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  language TEXT NOT NULL DEFAULT 'zh-CN',
  default_scope TEXT,
  start_page TEXT NOT NULL DEFAULT '首页',
  avatar_theme TEXT NOT NULL DEFAULT 'emerald',
  compact_dashboard INTEGER NOT NULL DEFAULT 0 CHECK (compact_dashboard IN (0, 1)),
  auto_open_analysis INTEGER NOT NULL DEFAULT 1 CHECK (auto_open_analysis IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  in_app INTEGER NOT NULL DEFAULT 1 CHECK (in_app IN (0, 1)),
  sms INTEGER NOT NULL DEFAULT 1 CHECK (sms IN (0, 1)),
  email INTEGER NOT NULL DEFAULT 0 CHECK (email IN (0, 1)),
  wecom INTEGER NOT NULL DEFAULT 1 CHECK (wecom IN (0, 1)),
  daily_report INTEGER NOT NULL DEFAULT 1 CHECK (daily_report IN (0, 1)),
  quiet_hours_enabled INTEGER NOT NULL DEFAULT 1 CHECK (quiet_hours_enabled IN (0, 1)),
  quiet_start TEXT NOT NULL DEFAULT '22:00',
  quiet_end TEXT NOT NULL DEFAULT '06:30',
  escalation_receiver TEXT NOT NULL,
  report_frequency TEXT NOT NULL DEFAULT '每日 18:00',
  last_test_channel TEXT NOT NULL DEFAULT '应用内通知',
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  retention_days INTEGER NOT NULL DEFAULT 180,
  backup_frequency TEXT NOT NULL DEFAULT '每日 02:00',
  backup_compression INTEGER NOT NULL DEFAULT 1 CHECK (backup_compression IN (0, 1)),
  mfa_required INTEGER NOT NULL DEFAULT 0 CHECK (mfa_required IN (0, 1)),
  api_read_only_mode INTEGER NOT NULL DEFAULT 0 CHECK (api_read_only_mode IN (0, 1)),
  session_timeout INTEGER NOT NULL DEFAULT 60,
  auto_export_alerts INTEGER NOT NULL DEFAULT 1 CHECK (auto_export_alerts IN (0, 1)),
  token_version TEXT NOT NULL,
  last_backup TEXT,
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operations_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  maintenance_mode INTEGER NOT NULL DEFAULT 0 CHECK (maintenance_mode IN (0, 1)),
  maintenance_window TEXT NOT NULL DEFAULT '周日 23:00 - 23:30',
  auto_health_check INTEGER NOT NULL DEFAULT 1 CHECK (auto_health_check IN (0, 1)),
  updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS config_snapshots (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('基线', '推荐', '历史', '最新')),
  payload_json TEXT NOT NULL,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_park_id ON users (park_id);
CREATE INDEX IF NOT EXISTS idx_greenhouses_park_id ON greenhouses (park_id);
CREATE INDEX IF NOT EXISTS idx_greenhouse_profiles_manager ON greenhouse_profiles (manager_user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_greenhouse_time ON sensor_readings (greenhouse_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_status_created_at ON decisions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status_occurred_at ON alerts (status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_events_started_at ON irrigation_events (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiments_status_start_date ON experiments (status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_phenotype_records_experiment_time ON phenotype_records (experiment_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_irrigation_scope_date ON analysis_irrigation_daily (scope_type, scope_ref, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_efficiency_snapshots_scope_month ON efficiency_snapshots (scope_type, scope_ref, record_month DESC);
CREATE INDEX IF NOT EXISTS idx_config_snapshots_created_at ON config_snapshots (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_occurred_at ON activity_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_archived_occurred_at ON activity_logs (archived, occurred_at DESC);
