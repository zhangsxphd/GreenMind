import { getDb } from '../database/client.js';

const RULE_PRESETS = {
  balanced: {
    highTemp: 35,
    highHumidity: 85,
    lowSoilMoisture: 25,
    highEc: 2.6,
    autoDecision: true,
    unattendedMode: false,
    weatherLinkage: true,
    severeEscalation: true,
    anomalyWindow: 120,
    notifyLevels: ['高', '中'],
  },
  conservative: {
    highTemp: 33,
    highHumidity: 82,
    lowSoilMoisture: 28,
    highEc: 2.3,
    autoDecision: true,
    unattendedMode: false,
    weatherLinkage: true,
    severeEscalation: true,
    anomalyWindow: 90,
    notifyLevels: ['高', '中'],
  },
  aggressive: {
    highTemp: 37,
    highHumidity: 88,
    lowSoilMoisture: 22,
    highEc: 2.9,
    autoDecision: true,
    unattendedMode: true,
    weatherLinkage: true,
    severeEscalation: true,
    anomalyWindow: 150,
    notifyLevels: ['高', '中'],
  },
};

const RULE_DEFINITIONS = {
  highTemp: {
    code: 'env.temp.high_threshold',
    category: 'environment',
    name: '高温报警阈值',
    description: '棚内温度超过该阈值时触发环境报警。',
    valueType: 'number',
    unit: '°C',
    comparisonOperator: '>',
    durationMinutes: 0,
    actionMode: 'alert_only',
  },
  highHumidity: {
    code: 'env.humidity.high_threshold',
    category: 'environment',
    name: '高湿报警阈值',
    description: '空气湿度超过该阈值时触发病害风险报警。',
    valueType: 'number',
    unit: '%',
    comparisonOperator: '>',
    durationMinutes: 0,
    actionMode: 'alert_only',
  },
  lowMoistureAutoDecision: {
    code: 'irrigation.low_moisture_auto_decision',
    category: 'irrigation',
    name: '基质含水率过低自动生成决策',
    description: '连续低于阈值时自动向决策中心推送灌溉建议。',
    valueType: 'boolean',
    unit: '%',
    comparisonOperator: '<',
    durationMinutes: 120,
    actionMode: 'decision_push',
  },
  unattendedMode: {
    code: 'system.full_auto_unattended',
    category: 'system',
    name: '全自动无人值守模式',
    description: '系统生成决策后直接联动执行设备。',
    valueType: 'boolean',
    unit: null,
    comparisonOperator: null,
    durationMinutes: null,
    actionMode: 'auto_execute',
  },
  highEc: {
    code: 'irrigation.ec.high_threshold',
    category: 'irrigation',
    name: '高 EC 阈值',
    description: '基质 EC 超过阈值时提示水肥风险。',
    valueType: 'number',
    unit: 'mS/cm',
    comparisonOperator: '>',
    durationMinutes: 0,
    actionMode: 'alert_only',
  },
  weatherLinkage: {
    code: 'weather.linkage_enabled',
    category: 'weather',
    name: '天气联动校正',
    description: '结合未来天气和蒸散模型自动修正阈值与策略。',
    valueType: 'boolean',
    unit: null,
    comparisonOperator: null,
    durationMinutes: null,
    actionMode: 'threshold_adjust',
  },
  severeEscalation: {
    code: 'alert.severe_escalation',
    category: 'alert',
    name: '高风险自动升级',
    description: '高风险报警自动升级到负责人。',
    valueType: 'boolean',
    unit: null,
    comparisonOperator: null,
    durationMinutes: null,
    actionMode: 'force_notify',
  },
  notifyLevels: {
    code: 'alert.notify_levels',
    category: 'alert',
    name: '报警通知等级',
    description: '定义需要通知的报警等级。',
    valueType: 'text',
    unit: null,
    comparisonOperator: null,
    durationMinutes: null,
    actionMode: 'notify_filter',
  },
};

const INTEGRATION_DISPLAY_MAP = {
  'iot-mqtt-gateway': {
    id: 'mqtt',
    name: '物联网 MQTT 网关',
    description: '接入环境传感器、阀门与水肥一体机。',
    defaultLatency: 9,
    testLatency: 8,
    healthLatency: 7,
  },
  'weather-bureau-api': {
    id: 'weather',
    name: '气象局数据接口',
    description: '获取未来 7 天天气并推算 ET0 与病害风险。',
    defaultLatency: 34,
    testLatency: 34,
    healthLatency: 31,
  },
  'research-sync-service': {
    id: 'sensor-cloud',
    name: '科研数据同步服务',
    description: '同步表型、试验设计与多源采集数据。',
    defaultLatency: 23,
    testLatency: 19,
    healthLatency: 16,
  },
};

const INTEGRATION_CODE_BY_ID = Object.fromEntries(
  Object.entries(INTEGRATION_DISPLAY_MAP).map(([code, value]) => [value.id, code]),
);

const DATE_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function nowIso() {
  return new Date().toISOString();
}

function toFlag(value) {
  return value ? 1 : 0;
}

function parseJson(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatDisplayTimestamp(value, fallback = '未启用') {
  if (!value) {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return DATE_FORMATTER.format(date);
}

function mapUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
    phone: row.phone,
    park: row.park,
  };
}

function getUserRow(db, userId) {
  const row = db
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.role,
        u.avatar,
        u.phone,
        COALESCE(up.affiliation, p.name, '') AS park
      FROM users u
      LEFT JOIN user_preferences up ON up.user_id = u.id
      LEFT JOIN parks p ON p.id = u.park_id
      WHERE u.id = ?
    `)
    .get(userId);

  if (!row) {
    throw new Error(`User ${userId} not found`);
  }

  return row;
}

function getRuleRows(db) {
  return db
    .prepare(`
      SELECT code, numeric_value, boolean_value, text_value, duration_minutes
      FROM system_rules
      WHERE code IN (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .all(
      RULE_DEFINITIONS.highTemp.code,
      RULE_DEFINITIONS.highHumidity.code,
      RULE_DEFINITIONS.lowMoistureAutoDecision.code,
      RULE_DEFINITIONS.unattendedMode.code,
      RULE_DEFINITIONS.highEc.code,
      RULE_DEFINITIONS.weatherLinkage.code,
      RULE_DEFINITIONS.severeEscalation.code,
      RULE_DEFINITIONS.notifyLevels.code,
    );
}

function mapRuleSettings(rows) {
  const rowMap = new Map(rows.map((row) => [row.code, row]));
  const lowMoistureRule = rowMap.get(RULE_DEFINITIONS.lowMoistureAutoDecision.code) ?? {};

  return {
    highTemp: rowMap.get(RULE_DEFINITIONS.highTemp.code)?.numeric_value ?? RULE_PRESETS.balanced.highTemp,
    highHumidity: rowMap.get(RULE_DEFINITIONS.highHumidity.code)?.numeric_value ?? RULE_PRESETS.balanced.highHumidity,
    lowSoilMoisture: lowMoistureRule.numeric_value ?? RULE_PRESETS.balanced.lowSoilMoisture,
    highEc: rowMap.get(RULE_DEFINITIONS.highEc.code)?.numeric_value ?? RULE_PRESETS.balanced.highEc,
    autoDecision: Boolean(lowMoistureRule.boolean_value ?? 1),
    unattendedMode: Boolean(rowMap.get(RULE_DEFINITIONS.unattendedMode.code)?.boolean_value ?? 0),
    weatherLinkage: Boolean(rowMap.get(RULE_DEFINITIONS.weatherLinkage.code)?.boolean_value ?? 1),
    severeEscalation: Boolean(rowMap.get(RULE_DEFINITIONS.severeEscalation.code)?.boolean_value ?? 1),
    anomalyWindow: lowMoistureRule.duration_minutes ?? RULE_PRESETS.balanced.anomalyWindow,
    notifyLevels:
      rowMap
        .get(RULE_DEFINITIONS.notifyLevels.code)
        ?.text_value?.split(',')
        .filter(Boolean) ?? [...RULE_PRESETS.balanced.notifyLevels],
  };
}

function inferRulePreset(ruleSettings) {
  return (
    Object.entries(RULE_PRESETS).find(([, preset]) => (
      preset.highTemp === ruleSettings.highTemp &&
      preset.highHumidity === ruleSettings.highHumidity &&
      preset.lowSoilMoisture === ruleSettings.lowSoilMoisture &&
      preset.highEc === ruleSettings.highEc &&
      preset.autoDecision === ruleSettings.autoDecision &&
      preset.unattendedMode === ruleSettings.unattendedMode &&
      preset.weatherLinkage === ruleSettings.weatherLinkage &&
      preset.severeEscalation === ruleSettings.severeEscalation &&
      preset.anomalyWindow === ruleSettings.anomalyWindow &&
      preset.notifyLevels.join(',') === ruleSettings.notifyLevels.join(',')
    ))?.[0] ?? 'balanced'
  );
}

function loadBasicSettings(db, userId) {
  const row = db
    .prepare(`
      SELECT
        u.name,
        u.role,
        u.phone,
        COALESCE(up.email, '') AS email,
        up.title,
        COALESCE(up.affiliation, p.name, '') AS affiliation,
        COALESCE(up.timezone, 'Asia/Shanghai') AS timezone,
        COALESCE(up.language, 'zh-CN') AS language,
        COALESCE(up.default_scope, COALESCE(up.affiliation, p.name, '')) AS default_scope,
        COALESCE(up.start_page, '首页') AS start_page,
        COALESCE(up.avatar_theme, 'emerald') AS avatar_theme,
        COALESCE(up.compact_dashboard, 0) AS compact_dashboard,
        COALESCE(up.auto_open_analysis, 1) AS auto_open_analysis
      FROM users u
      LEFT JOIN user_preferences up ON up.user_id = u.id
      LEFT JOIN parks p ON p.id = u.park_id
      WHERE u.id = ?
    `)
    .get(userId);

  if (!row) {
    throw new Error(`User ${userId} not found`);
  }

  return {
    name: row.name,
    phone: row.phone,
    park: row.affiliation,
    role: row.role,
    email: row.email,
    title: row.title || row.role.split('/')[0].trim(),
    timezone: row.timezone,
    language: row.language,
    defaultScope: row.default_scope,
    startPage: row.start_page,
    avatarTheme: row.avatar_theme,
    compactDashboard: Boolean(row.compact_dashboard),
    autoOpenAnalysis: Boolean(row.auto_open_analysis),
  };
}

function loadNotificationSettings(db) {
  const row = db.prepare('SELECT * FROM notification_settings WHERE id = 1').get();

  return {
    inApp: Boolean(row?.in_app ?? 1),
    sms: Boolean(row?.sms ?? 1),
    email: Boolean(row?.email ?? 0),
    wecom: Boolean(row?.wecom ?? 1),
    dailyReport: Boolean(row?.daily_report ?? 1),
    quietHoursEnabled: Boolean(row?.quiet_hours_enabled ?? 1),
    quietStart: row?.quiet_start ?? '22:00',
    quietEnd: row?.quiet_end ?? '06:30',
    escalationReceiver: row?.escalation_receiver ?? '李建国',
    reportFrequency: row?.report_frequency ?? '每日 18:00',
    lastTestChannel: row?.last_test_channel ?? '应用内通知',
  };
}

function mapIntegrationRow(row) {
  const config = parseJson(row.config_json);
  const display = INTEGRATION_DISPLAY_MAP[row.code] ?? {
    id: row.code,
    name: row.name,
    description: row.name,
  };

  return {
    id: display.id,
    code: row.code,
    name: display.name,
    type: row.type,
    endpoint: row.endpoint,
    status: row.status,
    enabled: Boolean(row.enabled),
    latency: row.response_time_ms ? `${row.response_time_ms}ms` : '--',
    description: display.description,
    credentialsVersion: config.credentialsVersion ?? 'v1',
    lastHeartbeat: formatDisplayTimestamp(row.last_heartbeat_at),
  };
}

function loadIntegrationServices(db) {
  return db.prepare('SELECT * FROM integration_services ORDER BY id ASC').all().map(mapIntegrationRow);
}

function loadSecuritySettings(db) {
  const row = db.prepare('SELECT * FROM security_settings WHERE id = 1').get();

  return {
    retentionDays: row?.retention_days ?? 180,
    backupFrequency: row?.backup_frequency ?? '每日 02:00',
    backupCompression: Boolean(row?.backup_compression ?? 1),
    mfaRequired: Boolean(row?.mfa_required ?? 0),
    apiReadOnlyMode: Boolean(row?.api_read_only_mode ?? 0),
    sessionTimeout: row?.session_timeout ?? 60,
    autoExportAlerts: Boolean(row?.auto_export_alerts ?? 1),
    tokenVersion: row?.token_version ?? 'token-v1',
    lastBackup: row?.last_backup ?? '未执行',
  };
}

function loadOpsSettings(db) {
  const row = db.prepare('SELECT * FROM operations_settings WHERE id = 1').get();

  return {
    maintenanceMode: Boolean(row?.maintenance_mode ?? 0),
    maintenanceWindow: row?.maintenance_window ?? '周日 23:00 - 23:30',
    autoHealthCheck: Boolean(row?.auto_health_check ?? 1),
  };
}

function loadConfigSnapshots(db) {
  return db
    .prepare('SELECT id, name, status, created_at FROM config_snapshots ORDER BY datetime(created_at) DESC, id DESC LIMIT 6')
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      time: formatDisplayTimestamp(row.created_at, row.created_at),
    }));
}

function loadOperationLogs(db) {
  return db
    .prepare(`
      SELECT al.id, al.summary, al.details_json, al.occurred_at, COALESCE(u.name, '系统') AS actor
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.archived = 0
      ORDER BY datetime(al.occurred_at) DESC, al.id DESC
      LIMIT 12
    `)
    .all()
    .map((row) => {
      const details = parseJson(row.details_json, {});
      return {
        id: row.id,
        action: row.summary,
        actor: row.actor,
        result: details.result ?? '成功',
        time: formatDisplayTimestamp(row.occurred_at, row.occurred_at),
      };
    });
}

function buildSnapshotPayload(db) {
  return {
    ruleSettings: loadRuleSettings(db),
    notificationSettings: loadNotificationSettings(db),
    integrationServices: loadIntegrationServices(db).map((item) => ({
      code: item.code,
      enabled: item.enabled,
      status: item.status,
      latency: item.latency,
      credentialsVersion: item.credentialsVersion,
    })),
    securitySettings: loadSecuritySettings(db),
    opsSettings: loadOpsSettings(db),
  };
}

function loadRuleSettings(db) {
  return mapRuleSettings(getRuleRows(db));
}

function insertActivityLog(db, { userId = null, entityType, entityId = null, action, summary, details = {} }) {
  db.prepare(`
    INSERT INTO activity_logs (user_id, entity_type, entity_id, action, summary, details_json, archived, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(userId, entityType, entityId, action, summary, JSON.stringify(details), nowIso());
}

function upsertSystemRule(db, code, payload) {
  db.prepare(`
    INSERT INTO system_rules (
      code, category, name, description, value_type, numeric_value,
      boolean_value, text_value, unit, comparison_operator,
      duration_minutes, action_mode, enabled, updated_by_user_id, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      category = excluded.category,
      name = excluded.name,
      description = excluded.description,
      value_type = excluded.value_type,
      numeric_value = excluded.numeric_value,
      boolean_value = excluded.boolean_value,
      text_value = excluded.text_value,
      unit = excluded.unit,
      comparison_operator = excluded.comparison_operator,
      duration_minutes = excluded.duration_minutes,
      action_mode = excluded.action_mode,
      enabled = excluded.enabled,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = excluded.updated_at
  `).run(
    code,
    payload.category,
    payload.name,
    payload.description,
    payload.valueType,
    payload.numericValue,
    payload.booleanValue,
    payload.textValue,
    payload.unit,
    payload.comparisonOperator,
    payload.durationMinutes,
    payload.actionMode,
    payload.updatedByUserId,
    payload.updatedAt,
  );
}

function saveRuleSettingsInternal(db, actorUserId, ruleSettings) {
  const updatedAt = nowIso();
  const lowMoistureMeta = RULE_DEFINITIONS.lowMoistureAutoDecision;

  upsertSystemRule(db, RULE_DEFINITIONS.highTemp.code, {
    ...RULE_DEFINITIONS.highTemp,
    numericValue: Number(ruleSettings.highTemp),
    booleanValue: null,
    textValue: null,
    updatedByUserId: actorUserId,
    updatedAt,
  });
  upsertSystemRule(db, RULE_DEFINITIONS.highHumidity.code, {
    ...RULE_DEFINITIONS.highHumidity,
    numericValue: Number(ruleSettings.highHumidity),
    booleanValue: null,
    textValue: null,
    updatedByUserId: actorUserId,
    updatedAt,
  });
  upsertSystemRule(db, lowMoistureMeta.code, {
    ...lowMoistureMeta,
    numericValue: Number(ruleSettings.lowSoilMoisture),
    booleanValue: toFlag(ruleSettings.autoDecision),
    textValue: `基质含水率低于${Number(ruleSettings.lowSoilMoisture)}%`,
    durationMinutes: Number(ruleSettings.anomalyWindow),
    updatedByUserId: actorUserId,
    updatedAt,
  });
  upsertSystemRule(db, RULE_DEFINITIONS.unattendedMode.code, {
    ...RULE_DEFINITIONS.unattendedMode,
    numericValue: null,
    booleanValue: toFlag(ruleSettings.unattendedMode),
    textValue: null,
    updatedByUserId: actorUserId,
    updatedAt,
  });
  upsertSystemRule(db, RULE_DEFINITIONS.highEc.code, {
    ...RULE_DEFINITIONS.highEc,
    numericValue: Number(ruleSettings.highEc),
    booleanValue: null,
    textValue: null,
    updatedByUserId: actorUserId,
    updatedAt,
  });
  upsertSystemRule(db, RULE_DEFINITIONS.weatherLinkage.code, {
    ...RULE_DEFINITIONS.weatherLinkage,
    numericValue: null,
    booleanValue: toFlag(ruleSettings.weatherLinkage),
    textValue: null,
    updatedByUserId: actorUserId,
    updatedAt,
  });
  upsertSystemRule(db, RULE_DEFINITIONS.severeEscalation.code, {
    ...RULE_DEFINITIONS.severeEscalation,
    numericValue: null,
    booleanValue: toFlag(ruleSettings.severeEscalation),
    textValue: null,
    updatedByUserId: actorUserId,
    updatedAt,
  });
  upsertSystemRule(db, RULE_DEFINITIONS.notifyLevels.code, {
    ...RULE_DEFINITIONS.notifyLevels,
    numericValue: null,
    booleanValue: null,
    textValue: ruleSettings.notifyLevels.join(','),
    updatedByUserId: actorUserId,
    updatedAt,
  });
}

function saveNotificationSettingsInternal(db, actorUserId, notificationSettings) {
  db.prepare(`
    INSERT INTO notification_settings (
      id, in_app, sms, email, wecom, daily_report,
      quiet_hours_enabled, quiet_start, quiet_end, escalation_receiver,
      report_frequency, last_test_channel, updated_by_user_id, updated_at
    )
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      in_app = excluded.in_app,
      sms = excluded.sms,
      email = excluded.email,
      wecom = excluded.wecom,
      daily_report = excluded.daily_report,
      quiet_hours_enabled = excluded.quiet_hours_enabled,
      quiet_start = excluded.quiet_start,
      quiet_end = excluded.quiet_end,
      escalation_receiver = excluded.escalation_receiver,
      report_frequency = excluded.report_frequency,
      last_test_channel = excluded.last_test_channel,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = excluded.updated_at
  `).run(
    toFlag(notificationSettings.inApp),
    toFlag(notificationSettings.sms),
    toFlag(notificationSettings.email),
    toFlag(notificationSettings.wecom),
    toFlag(notificationSettings.dailyReport),
    toFlag(notificationSettings.quietHoursEnabled),
    notificationSettings.quietStart,
    notificationSettings.quietEnd,
    notificationSettings.escalationReceiver,
    notificationSettings.reportFrequency,
    notificationSettings.lastTestChannel,
    actorUserId,
    nowIso(),
  );
}

function saveSecuritySettingsInternal(db, actorUserId, securitySettings) {
  db.prepare(`
    INSERT INTO security_settings (
      id, retention_days, backup_frequency, backup_compression, mfa_required,
      api_read_only_mode, session_timeout, auto_export_alerts,
      token_version, last_backup, updated_by_user_id, updated_at
    )
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      retention_days = excluded.retention_days,
      backup_frequency = excluded.backup_frequency,
      backup_compression = excluded.backup_compression,
      mfa_required = excluded.mfa_required,
      api_read_only_mode = excluded.api_read_only_mode,
      session_timeout = excluded.session_timeout,
      auto_export_alerts = excluded.auto_export_alerts,
      token_version = excluded.token_version,
      last_backup = excluded.last_backup,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = excluded.updated_at
  `).run(
    Number(securitySettings.retentionDays),
    securitySettings.backupFrequency,
    toFlag(securitySettings.backupCompression),
    toFlag(securitySettings.mfaRequired),
    toFlag(securitySettings.apiReadOnlyMode),
    Number(securitySettings.sessionTimeout),
    toFlag(securitySettings.autoExportAlerts),
    securitySettings.tokenVersion,
    securitySettings.lastBackup,
    actorUserId,
    nowIso(),
  );
}

function saveOpsSettingsInternal(db, actorUserId, opsSettings) {
  db.prepare(`
    INSERT INTO operations_settings (
      id, maintenance_mode, maintenance_window, auto_health_check, updated_by_user_id, updated_at
    )
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      maintenance_mode = excluded.maintenance_mode,
      maintenance_window = excluded.maintenance_window,
      auto_health_check = excluded.auto_health_check,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = excluded.updated_at
  `).run(
    toFlag(opsSettings.maintenanceMode),
    opsSettings.maintenanceWindow,
    toFlag(opsSettings.autoHealthCheck),
    actorUserId,
    nowIso(),
  );
}

function updateIntegrationService(db, code, updater) {
  const row = db.prepare('SELECT * FROM integration_services WHERE code = ?').get(code);

  if (!row) {
    throw new Error(`Integration ${code} not found`);
  }

  const config = parseJson(row.config_json);
  const next = updater({ row, config, display: INTEGRATION_DISPLAY_MAP[code] ?? {} });

  db.prepare(`
    UPDATE integration_services
    SET status = ?, enabled = ?, response_time_ms = ?, last_heartbeat_at = ?, config_json = ?, updated_at = ?
    WHERE code = ?
  `).run(
    next.status,
    next.enabled,
    next.responseTimeMs,
    next.lastHeartbeatAt,
    JSON.stringify(next.config),
    nowIso(),
    code,
  );
}

export function listUsers() {
  const db = getDb();

  return db
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.role,
        u.avatar,
        u.phone,
        COALESCE(up.affiliation, p.name, '') AS park
      FROM users u
      LEFT JOIN user_preferences up ON up.user_id = u.id
      LEFT JOIN parks p ON p.id = u.park_id
      ORDER BY u.id ASC
    `)
    .all()
    .map(mapUserRow);
}

export function getSettingsBundle(userId) {
  const db = getDb();
  const currentUser = mapUserRow(getUserRow(db, userId));
  const ruleSettings = loadRuleSettings(db);

  return {
    currentUser,
    basicSettings: loadBasicSettings(db, userId),
    ruleSettings,
    notificationSettings: loadNotificationSettings(db),
    integrationServices: loadIntegrationServices(db),
    securitySettings: loadSecuritySettings(db),
    opsSettings: loadOpsSettings(db),
    configSnapshots: loadConfigSnapshots(db),
    operationLogs: loadOperationLogs(db),
    lastRulePreset: inferRulePreset(ruleSettings),
  };
}

export function saveBasicSettings(userId, basicSettings) {
  const db = getDb();

  db.transaction(() => {
    db.prepare('UPDATE users SET name = ?, phone = ?, updated_at = ? WHERE id = ?').run(
      basicSettings.name,
      basicSettings.phone,
      nowIso(),
      userId,
    );

    db.prepare(`
      INSERT INTO user_preferences (
        user_id, email, title, affiliation, timezone, language,
        default_scope, start_page, avatar_theme, compact_dashboard,
        auto_open_analysis, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        email = excluded.email,
        title = excluded.title,
        affiliation = excluded.affiliation,
        timezone = excluded.timezone,
        language = excluded.language,
        default_scope = excluded.default_scope,
        start_page = excluded.start_page,
        avatar_theme = excluded.avatar_theme,
        compact_dashboard = excluded.compact_dashboard,
        auto_open_analysis = excluded.auto_open_analysis,
        updated_at = excluded.updated_at
    `).run(
      userId,
      basicSettings.email,
      basicSettings.title,
      basicSettings.park,
      basicSettings.timezone,
      basicSettings.language,
      basicSettings.defaultScope,
      basicSettings.startPage,
      basicSettings.avatarTheme,
      toFlag(basicSettings.compactDashboard),
      toFlag(basicSettings.autoOpenAnalysis),
      nowIso(),
    );

    insertActivityLog(db, {
      userId,
      entityType: 'settings.basic',
      action: 'update',
      summary: '保存基本信息与界面偏好',
      details: { result: '成功', scope: basicSettings.defaultScope },
    });
  })();

  return getSettingsBundle(userId);
}

export function saveRuleSettings(actorUserId, userId, ruleSettings) {
  const db = getDb();

  db.transaction(() => {
    saveRuleSettingsInternal(db, actorUserId, ruleSettings);
    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.rule',
      action: 'update',
      summary: '保存报警与决策规则',
      details: { result: '成功', mode: ruleSettings.unattendedMode ? 'auto' : 'manual' },
    });
  })();

  return getSettingsBundle(userId);
}

export function simulateRuleSettings(actorUserId, userId) {
  const db = getDb();
  const ruleSettings = loadRuleSettings(db);
  const summary = `高温>${ruleSettings.highTemp}°C，高湿>${ruleSettings.highHumidity}% ，低水分<${ruleSettings.lowSoilMoisture}%`;

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'settings.rule',
    action: 'simulate',
    summary: `执行规则模拟：${summary}`,
    details: { result: '成功', summary },
  });

  return {
    settings: getSettingsBundle(userId),
    simulationSummary: summary,
  };
}

export function saveNotificationSettings(actorUserId, userId, notificationSettings) {
  const db = getDb();

  db.transaction(() => {
    saveNotificationSettingsInternal(db, actorUserId, notificationSettings);
    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.notification',
      action: 'update',
      summary: '保存通知策略',
      details: { result: '成功', reportFrequency: notificationSettings.reportFrequency },
    });
  })();

  return getSettingsBundle(userId);
}

export function testNotificationChannel(actorUserId, userId, channel) {
  const db = getDb();
  const current = loadNotificationSettings(db);

  saveNotificationSettingsInternal(db, actorUserId, {
    ...current,
    lastTestChannel: channel,
  });

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'settings.notification',
    action: 'test',
    summary: `测试通知渠道：${channel}`,
    details: { result: '成功', channel },
  });

  return getSettingsBundle(userId);
}

export function saveSecuritySettings(actorUserId, userId, securitySettings) {
  const db = getDb();

  db.transaction(() => {
    saveSecuritySettingsInternal(db, actorUserId, securitySettings);
    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.security',
      action: 'update',
      summary: '保存数据与安全配置',
      details: { result: '成功', sessionTimeout: securitySettings.sessionTimeout },
    });
  })();

  return getSettingsBundle(userId);
}

export function saveOpsSettings(actorUserId, userId, opsSettings) {
  const db = getDb();

  db.transaction(() => {
    saveOpsSettingsInternal(db, actorUserId, opsSettings);
    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.ops',
      action: 'update',
      summary: '保存运维配置',
      details: { result: '成功', maintenanceMode: opsSettings.maintenanceMode },
    });
  })();

  return getSettingsBundle(userId);
}

export function toggleIntegration(actorUserId, userId, integrationId) {
  const db = getDb();
  const code = INTEGRATION_CODE_BY_ID[integrationId] ?? integrationId;

  updateIntegrationService(db, code, ({ row, config, display }) => {
    const enabled = row.enabled ? 0 : 1;
    return {
      enabled,
      status: enabled ? 'connected' : 'stopped',
      responseTimeMs: enabled ? row.response_time_ms ?? display.defaultLatency ?? 18 : null,
      lastHeartbeatAt: enabled ? nowIso() : null,
      config,
    };
  });

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'integration',
    action: 'toggle',
    summary: `切换集成服务：${INTEGRATION_DISPLAY_MAP[code]?.name ?? code}`,
    details: { result: '成功', code },
  });

  return getSettingsBundle(userId);
}

export function testIntegration(actorUserId, userId, integrationId) {
  const db = getDb();
  const code = INTEGRATION_CODE_BY_ID[integrationId] ?? integrationId;

  updateIntegrationService(db, code, ({ config, display }) => ({
    enabled: 1,
    status: 'connected',
    responseTimeMs: display.testLatency ?? 18,
    lastHeartbeatAt: nowIso(),
    config,
  }));

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'integration',
    action: 'test',
    summary: `测试集成服务连接：${INTEGRATION_DISPLAY_MAP[code]?.name ?? code}`,
    details: { result: '成功', code },
  });

  return getSettingsBundle(userId);
}

export function rotateIntegrationKey(actorUserId, userId, integrationId) {
  const db = getDb();
  const code = INTEGRATION_CODE_BY_ID[integrationId] ?? integrationId;

  updateIntegrationService(db, code, ({ row, config }) => {
    const currentVersion = Number(String(config.credentialsVersion ?? 'v1').replace('v', '')) || 1;

    return {
      enabled: row.enabled,
      status: row.status,
      responseTimeMs: row.response_time_ms,
      lastHeartbeatAt: row.last_heartbeat_at,
      config: {
        ...config,
        credentialsVersion: `v${currentVersion + 1}`,
      },
    };
  });

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'integration',
    action: 'rotate-key',
    summary: `轮换集成服务密钥：${INTEGRATION_DISPLAY_MAP[code]?.name ?? code}`,
    details: { result: '成功', code },
  });

  return getSettingsBundle(userId);
}

export function createBackup(actorUserId, userId) {
  const db = getDb();
  const current = loadSecuritySettings(db);

  saveSecuritySettingsInternal(db, actorUserId, {
    ...current,
    lastBackup: formatDisplayTimestamp(nowIso()),
  });

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'settings.security',
    action: 'backup',
    summary: '创建最新配置备份包',
    details: { result: '成功' },
  });

  return getSettingsBundle(userId);
}

export function rotateSecurityToken(actorUserId, userId) {
  const db = getDb();
  const current = loadSecuritySettings(db);
  const tokenVersion = `token-v5-${Date.now().toString().slice(-6)}`;

  saveSecuritySettingsInternal(db, actorUserId, {
    ...current,
    tokenVersion,
  });

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'settings.security',
    action: 'rotate-token',
    summary: '轮换 API Token',
    details: { result: '成功', tokenVersion },
  });

  return getSettingsBundle(userId);
}

export function runHealthCheck(actorUserId, userId) {
  const db = getDb();

  db.transaction(() => {
    Object.keys(INTEGRATION_DISPLAY_MAP).forEach((code) => {
      updateIntegrationService(db, code, ({ row, config, display }) => ({
        enabled: row.enabled,
        status: row.enabled ? 'connected' : 'stopped',
        responseTimeMs: row.enabled ? display.healthLatency ?? display.defaultLatency ?? 18 : null,
        lastHeartbeatAt: row.enabled ? nowIso() : null,
        config,
      }));
    });

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.ops',
      action: 'health-check',
      summary: '执行系统健康巡检',
      details: { result: '成功' },
    });
  })();

  return getSettingsBundle(userId);
}

export function exportSettingsPackage(actorUserId, userId) {
  const db = getDb();

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'settings.ops',
    action: 'export',
    summary: '导出系统配置包',
    details: { result: '成功' },
  });

  return getSettingsBundle(userId);
}

export function createConfigSnapshot(actorUserId, userId, name) {
  const db = getDb();
  const snapshotName = name?.trim() || `手动配置快照 ${Date.now().toString().slice(-4)}`;

  db.transaction(() => {
    db.prepare("UPDATE config_snapshots SET status = '历史' WHERE status = '最新'").run();
    db.prepare(`
      INSERT INTO config_snapshots (name, status, payload_json, created_by_user_id, created_at)
      VALUES (?, '最新', ?, ?, ?)
    `).run(snapshotName, JSON.stringify(buildSnapshotPayload(db)), actorUserId, nowIso());

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.snapshot',
      action: 'create',
      summary: `创建配置快照：${snapshotName}`,
      details: { result: '成功', name: snapshotName },
    });
  })();

  return getSettingsBundle(userId);
}

export function restoreConfigSnapshot(actorUserId, userId, snapshotId) {
  const db = getDb();
  const snapshot = db.prepare('SELECT * FROM config_snapshots WHERE id = ?').get(snapshotId);

  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }

  const payload = parseJson(snapshot.payload_json, {});

  db.transaction(() => {
    if (payload.ruleSettings) {
      saveRuleSettingsInternal(db, actorUserId, payload.ruleSettings);
    }

    if (payload.notificationSettings) {
      saveNotificationSettingsInternal(db, actorUserId, payload.notificationSettings);
    }

    if (payload.securitySettings) {
      const current = loadSecuritySettings(db);
      saveSecuritySettingsInternal(db, actorUserId, {
        ...current,
        ...payload.securitySettings,
        lastBackup: current.lastBackup,
      });
    }

    if (payload.opsSettings) {
      saveOpsSettingsInternal(db, actorUserId, payload.opsSettings);
    }

    if (Array.isArray(payload.integrationServices)) {
      payload.integrationServices.forEach((service) => {
        updateIntegrationService(db, service.code, ({ config }) => ({
          enabled: toFlag(service.enabled),
          status: service.status,
          responseTimeMs: service.latency === '--' ? null : Number(String(service.latency).replace('ms', '')),
          lastHeartbeatAt: service.enabled ? nowIso() : null,
          config: {
            ...config,
            credentialsVersion: service.credentialsVersion ?? config.credentialsVersion ?? 'v1',
          },
        }));
      });
    }

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.snapshot',
      action: 'restore',
      summary: `恢复配置快照：${snapshot.name}`,
      details: { result: '成功', snapshotId },
    });
  })();

  return getSettingsBundle(userId);
}

export function archiveActivityLogs(actorUserId, userId) {
  const db = getDb();
  const rows = db
    .prepare('SELECT id FROM activity_logs WHERE archived = 0 ORDER BY datetime(occurred_at) DESC, id DESC')
    .all();
  const keepIds = new Set(rows.slice(0, 3).map((row) => row.id));
  const archiveIds = rows.filter((row) => !keepIds.has(row.id)).map((row) => row.id);

  db.transaction(() => {
    if (archiveIds.length > 0) {
      const placeholders = archiveIds.map(() => '?').join(', ');
      db.prepare(`UPDATE activity_logs SET archived = 1 WHERE id IN (${placeholders})`).run(...archiveIds);
    }

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'settings.audit',
      action: 'archive',
      summary: `归档历史日志 ${archiveIds.length} 条`,
      details: { result: '成功', archivedCount: archiveIds.length },
    });
  })();

  return getSettingsBundle(userId);
}
