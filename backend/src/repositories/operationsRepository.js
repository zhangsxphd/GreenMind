import { getDb } from '../database/client.js';

const STATUS_LABELS = {
  queued: '待执行',
  success: '已执行',
  failed: '执行失败',
  cancelled: '已取消',
};

function nowIso() {
  return new Date().toISOString();
}

function todayDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatDateTime(value, fallback = '尚未记录') {
  if (!value) {
    return fallback;
  }

  return value.slice(0, 16).replace('T', ' ');
}

function shiftDateString(dateString, offsetDays) {
  const date = new Date(`${dateString}T00:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function formatAlertTime(value) {
  if (!value) {
    return '--:--';
  }

  const datePart = value.slice(0, 10);
  const timePart = value.slice(11, 16);
  const today = todayDateString();

  if (datePart === today) {
    return timePart;
  }

  if (datePart === shiftDateString(today, -1)) {
    return `昨天 ${timePart}`;
  }

  if (datePart === shiftDateString(today, -2)) {
    return `前天 ${timePart}`;
  }

  return `${value.slice(5, 10)} ${timePart}`;
}

function buildRange(min, max, suffix) {
  if (min == null || max == null) {
    return '待配置';
  }

  return `${min}-${max}${suffix}`;
}

function toGreenhouseSummary(row) {
  return {
    id: row.id,
    name: row.name,
    crop: `${row.crop_name} (${row.growth_stage})`,
    temp: Number(row.temp),
    humidity: Number(row.humidity),
    soilMoisture: Number(row.soil_moisture),
    ec: Number(row.ec),
    status: row.status,
    location: row.park_name ? `${row.park_name} · ${row.zone_name}` : row.zone_name,
    area: row.area_sqm ? `${row.area_sqm}㎡` : '待完善',
    manager: row.manager_name ?? '待分配',
    deviceHealth: `${row.device_online_count ?? row.online_device_count}/${row.device_total_count ?? row.online_device_count}在线`,
    waterStrategy: row.irrigation_strategy ?? '待配置',
    structureType: row.structure_type,
    irrigationMode: row.irrigation_mode,
    lastCollectedAt: row.last_collected_at,
  };
}

function mapDecisionRow(row) {
  return {
    id: row.id,
    greenhouse: row.greenhouse_name.replace(/\s*\([^)]+\)$/, ''),
    type: row.type,
    action: row.action,
    confidence: `${Math.round(row.confidence * 100)}%`,
    reason: row.reason,
    status: row.status,
  };
}

function mapAlertRow(row) {
  return {
    id: row.id,
    greenhouseId: row.greenhouse_id,
    greenhouseName: row.greenhouse_name,
    type: row.type,
    level: row.level,
    content: row.content,
    resolved: Boolean(row.resolved),
    status: row.status,
    time: formatAlertTime(row.occurred_at),
    occurredAt: row.occurred_at,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note,
    resolvedBy: row.resolved_by_name,
  };
}

function insertActivityLog(db, { userId = null, entityType, entityId = null, action, summary, details = {} }) {
  db.prepare(`
    INSERT INTO activity_logs (user_id, entity_type, entity_id, action, summary, details_json, archived, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(userId, entityType, entityId, action, summary, JSON.stringify(details), nowIso());
}

function getNextId(db, tableName) {
  const row = db.prepare(`SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM ${tableName}`).get();
  return row.nextId;
}

function getUserContext(db, userId) {
  const row = db
    .prepare(`
      SELECT u.id, u.name, u.park_id, p.name AS park_name
      FROM users u
      LEFT JOIN parks p ON p.id = u.park_id
      WHERE u.id = ?
    `)
    .get(userId);

  if (!row) {
    throw new Error(`User ${userId} not found`);
  }

  return row;
}

function inferZoneName(name, location) {
  if (location?.includes('·')) {
    return location.split('·').pop().trim() || '新接入区';
  }

  const zoneMatch = name.match(/^([A-Z]区)/i);
  return zoneMatch?.[1] ?? '新接入区';
}

function inferStructureType(name) {
  const match = name.match(/\(([^)]+)\)/);
  return match?.[1] ?? '标准棚';
}

function inferCode(zoneName, id) {
  const zoneToken = zoneName.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase() || 'GH';
  return `${zoneToken}-${String(id).padStart(3, '0')}`;
}

function findManagerUserId(db, managerName, fallbackUserId) {
  if (!managerName) {
    return fallbackUserId;
  }

  const row = db.prepare('SELECT id FROM users WHERE name = ?').get(managerName);
  return row?.id ?? fallbackUserId;
}

function buildDefaultTargets(cropName, temp, humidity, soilMoisture, ec) {
  if (cropName.includes('草莓') || cropName.includes('蓝莓')) {
    return {
      targetTempMin: 18,
      targetTempMax: Math.max(24, Math.round(temp + 1)),
      targetHumidityMin: 55,
      targetHumidityMax: 68,
      targetSoilMoistureMin: 24,
      targetSoilMoistureMax: Math.max(32, Math.round(soilMoisture + 2)),
      targetEcMin: 1.1,
      targetEcMax: Math.max(1.5, Number((ec + 0.2).toFixed(1))),
    };
  }

  if (cropName.includes('苗')) {
    return {
      targetTempMin: 22,
      targetTempMax: 27,
      targetHumidityMin: 68,
      targetHumidityMax: 80,
      targetSoilMoistureMin: 30,
      targetSoilMoistureMax: 38,
      targetEcMin: 1.2,
      targetEcMax: 1.8,
    };
  }

  return {
    targetTempMin: Math.max(18, Math.round(temp - 3)),
    targetTempMax: Math.max(26, Math.round(temp + 2)),
    targetHumidityMin: 58,
    targetHumidityMax: Math.max(72, Math.round(humidity + 5)),
    targetSoilMoistureMin: Math.max(20, Math.round(soilMoisture - 4)),
    targetSoilMoistureMax: Math.max(32, Math.round(soilMoisture + 4)),
    targetEcMin: Math.max(1, Number((ec - 0.3).toFixed(1))),
    targetEcMax: Math.max(1.8, Number((ec + 0.4).toFixed(1))),
  };
}

function listGreenhousesBase(db) {
  return db
    .prepare(`
      SELECT
        g.id,
        g.name,
        g.code,
        g.zone_name,
        g.crop_name,
        g.growth_stage,
        g.structure_type,
        g.temp,
        g.humidity,
        g.soil_moisture,
        g.ec,
        g.status,
        g.online_device_count,
        g.irrigation_mode,
        g.last_collected_at,
        p.name AS park_name,
        gp.area_sqm,
        gp.device_total_count,
        gp.device_online_count,
        gp.irrigation_strategy,
        gp.last_service_at,
        u.name AS manager_name
      FROM greenhouses g
      LEFT JOIN parks p ON p.id = g.park_id
      LEFT JOIN greenhouse_profiles gp ON gp.greenhouse_id = g.id
      LEFT JOIN users u ON u.id = gp.manager_user_id
      ORDER BY CASE g.status WHEN 'warning' THEN 0 WHEN 'maintenance' THEN 1 WHEN 'offline' THEN 2 ELSE 3 END, g.name ASC
    `)
    .all();
}

function getGreenhouseBaseRow(db, greenhouseId) {
  const row = db
    .prepare(`
      SELECT
        g.id,
        g.park_id,
        g.name,
        g.code,
        g.zone_name,
        g.crop_name,
        g.growth_stage,
        g.structure_type,
        g.temp,
        g.humidity,
        g.soil_moisture,
        g.ec,
        g.status,
        g.online_device_count,
        g.irrigation_mode,
        g.last_collected_at,
        p.name AS park_name,
        gp.manager_user_id,
        gp.area_sqm,
        gp.device_total_count,
        gp.device_online_count,
        gp.irrigation_strategy,
        gp.last_service_at,
        gp.target_temp_min,
        gp.target_temp_max,
        gp.target_humidity_min,
        gp.target_humidity_max,
        gp.target_soil_moisture_min,
        gp.target_soil_moisture_max,
        gp.target_ec_min,
        gp.target_ec_max,
        gp.notes_json,
        gp.device_state_json,
        u.name AS manager_name
      FROM greenhouses g
      LEFT JOIN parks p ON p.id = g.park_id
      LEFT JOIN greenhouse_profiles gp ON gp.greenhouse_id = g.id
      LEFT JOIN users u ON u.id = gp.manager_user_id
      WHERE g.id = ?
    `)
    .get(greenhouseId);

  if (!row) {
    throw new Error(`Greenhouse ${greenhouseId} not found`);
  }

  return row;
}

function loadTrend(db, greenhouseId) {
  const rows = db
    .prepare(`
      SELECT recorded_at, temp, humidity, soil_moisture, ec
      FROM sensor_readings
      WHERE greenhouse_id = ?
      ORDER BY datetime(recorded_at) DESC, id DESC
      LIMIT 6
    `)
    .all(greenhouseId)
    .reverse();

  return rows.map((row) => ({
    time: row.recorded_at.slice(11, 16),
    temp: Number(row.temp),
    humidity: Number(row.humidity),
    soilMoisture: Number(row.soil_moisture),
    ec: Number(row.ec),
  }));
}

function loadRecentCommands(db, greenhouseId) {
  const controlRows = db
    .prepare(`
      SELECT id, requested_at AS occurred_at, result_message AS description, status
      FROM control_logs
      WHERE greenhouse_id = ?
    `)
    .all(greenhouseId)
    .map((row) => ({
      id: `control-${row.id}`,
      occurred_at: row.occurred_at,
      description: row.description,
      status: STATUS_LABELS[row.status] ?? row.status,
    }));

  const irrigationRows = db
    .prepare(`
      SELECT id, started_at AS occurred_at, duration_minutes, notes
      FROM irrigation_events
      WHERE greenhouse_id = ?
    `)
    .all(greenhouseId)
    .map((row) => ({
      id: `irrigation-${row.id}`,
      occurred_at: row.occurred_at,
      description: row.notes || `完成灌溉 ${row.duration_minutes} 分钟`,
      status: '已完成',
    }));

  return [...controlRows, ...irrigationRows]
    .sort((left, right) => right.occurred_at.localeCompare(left.occurred_at))
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      time: formatAlertTime(item.occurred_at),
      description: item.description,
      status: item.status,
    }));
}

function buildGreenhouseDetail(db, greenhouseId) {
  const row = getGreenhouseBaseRow(db, greenhouseId);
  const notes = parseJson(row.notes_json, []);
  const devices = parseJson(row.device_state_json, {
    irrigation: false,
    ventilation: 0,
    nutrientPump: false,
    fillLight: false,
    shadeScreen: 0,
  });

  return {
    ...toGreenhouseSummary(row),
    lastService: formatDateTime(row.last_service_at),
    targets: {
      temp: buildRange(row.target_temp_min, row.target_temp_max, '°C'),
      humidity: buildRange(row.target_humidity_min, row.target_humidity_max, '%'),
      soilMoisture: buildRange(row.target_soil_moisture_min, row.target_soil_moisture_max, '%'),
      ec: buildRange(row.target_ec_min, row.target_ec_max, ' mS/cm'),
    },
    notes,
    devices,
    trend: loadTrend(db, greenhouseId),
    recentCommands: loadRecentCommands(db, greenhouseId),
  };
}

function computeGreenhouseStatus(currentStatus, humidity, soilMoisture, activeAlertCount) {
  if (currentStatus === 'offline' || currentStatus === 'maintenance') {
    return currentStatus;
  }

  if (activeAlertCount > 0) {
    return 'warning';
  }

  return humidity < 80 && soilMoisture >= 25 ? 'normal' : 'warning';
}

function refreshGreenhouseStatus(db, greenhouseId) {
  const row = db.prepare('SELECT status, humidity, soil_moisture FROM greenhouses WHERE id = ?').get(greenhouseId);

  if (!row) {
    return;
  }

  const activeAlertCount = db
    .prepare("SELECT COUNT(*) AS count FROM alerts WHERE greenhouse_id = ? AND resolved = 0 AND status = 'active'")
    .get(greenhouseId).count;

  const nextStatus = computeGreenhouseStatus(row.status, row.humidity, row.soil_moisture, activeAlertCount);
  db.prepare('UPDATE greenhouses SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, nowIso(), greenhouseId);
}

function createSensorSnapshot(db, greenhouseId, values) {
  db.prepare(`
    INSERT INTO sensor_readings (id, greenhouse_id, recorded_at, temp, humidity, soil_moisture, ec, light_lux, co2_ppm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    getNextId(db, 'sensor_readings'),
    greenhouseId,
    values.recordedAt,
    values.temp,
    values.humidity,
    values.soilMoisture,
    values.ec,
    values.lightLux ?? 0,
    values.co2Ppm ?? 0,
  );
}

function insertControlLog(db, { greenhouseId, userId, actionType, target, command, status, resultMessage, metadata }) {
  const requestedAt = nowIso();
  db.prepare(`
    INSERT INTO control_logs (
      id, greenhouse_id, user_id, action_type, target, command,
      status, requested_at, executed_at, result_message, metadata_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    getNextId(db, 'control_logs'),
    greenhouseId,
    userId,
    actionType,
    target,
    command,
    status,
    requestedAt,
    status === 'success' ? requestedAt : null,
    resultMessage,
    JSON.stringify(metadata ?? {}),
  );
}

function insertIrrigationEvent(db, { greenhouseId, decisionId = null, userId, triggerSource, durationMinutes, waterVolume, notes }) {
  const startedAt = nowIso();
  db.prepare(`
    INSERT INTO irrigation_events (
      id, greenhouse_id, decision_id, initiated_by_user_id, trigger_source,
      duration_minutes, water_volume_m3, started_at, completed_at, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    getNextId(db, 'irrigation_events'),
    greenhouseId,
    decisionId,
    userId,
    triggerSource,
    durationMinutes,
    waterVolume,
    startedAt,
    startedAt,
    notes,
  );
}

function getAlertRowById(db, alertId) {
  const row = db
    .prepare(`
      SELECT a.*, g.name AS greenhouse_name, ru.name AS resolved_by_name
      FROM alerts a
      LEFT JOIN greenhouses g ON g.id = a.greenhouse_id
      LEFT JOIN users ru ON ru.id = a.resolved_by_user_id
      WHERE a.id = ?
    `)
    .get(alertId);

  if (!row) {
    throw new Error(`Alert ${alertId} not found`);
  }

  return row;
}

function getDecisionRowById(db, decisionId) {
  const row = db
    .prepare(`
      SELECT d.*, g.name AS greenhouse_name
      FROM decisions d
      INNER JOIN greenhouses g ON g.id = d.greenhouse_id
      WHERE d.id = ?
    `)
    .get(decisionId);

  if (!row) {
    throw new Error(`Decision ${decisionId} not found`);
  }

  return row;
}

export function listGreenhouses() {
  const db = getDb();
  return listGreenhousesBase(db).map(toGreenhouseSummary);
}

export function getGreenhouseDetail(greenhouseId) {
  const db = getDb();
  return buildGreenhouseDetail(db, greenhouseId);
}

export function createGreenhouse(actorUserId, payload) {
  const db = getDb();

  return db.transaction(() => {
    const actor = getUserContext(db, actorUserId);
    const greenhouseId = getNextId(db, 'greenhouses');
    const greenhouseName = payload.greenhouseName.trim();
    const cropName = payload.crop.trim();
    const growthStage = payload.stage.trim();
    const zoneName = inferZoneName(greenhouseName, payload.location);
    const structureType = inferStructureType(greenhouseName);
    const temp = Number(payload.temp);
    const humidity = Number(payload.humidity);
    const soilMoisture = Number(payload.soilMoisture);
    const ec = Number(payload.ec);
    const targets = buildDefaultTargets(cropName, temp, humidity, soilMoisture, ec);
    const managerUserId = findManagerUserId(db, payload.manager?.trim(), actor.id);
    const deviceTotalCount = Number(payload.deviceCount);
    const onlineDeviceCount = payload.status === 'offline' ? 0 : deviceTotalCount;
    const irrigationMode = payload.strategy?.includes('AI') ? 'assisted' : 'manual';
    const createdAt = nowIso();

    db.prepare(`
      INSERT INTO greenhouses (
        id, park_id, name, code, zone_name, crop_name, growth_stage, structure_type,
        temp, humidity, soil_moisture, ec, status, online_device_count,
        irrigation_mode, last_collected_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      greenhouseId,
      actor.park_id,
      greenhouseName,
      inferCode(zoneName, greenhouseId),
      zoneName,
      cropName,
      growthStage,
      structureType,
      temp,
      humidity,
      soilMoisture,
      ec,
      payload.status,
      onlineDeviceCount,
      irrigationMode,
      createdAt,
      createdAt,
      createdAt,
    );

    db.prepare(`
      INSERT INTO greenhouse_profiles (
        greenhouse_id, manager_user_id, area_sqm, device_total_count, device_online_count,
        irrigation_strategy, last_service_at, target_temp_min, target_temp_max,
        target_humidity_min, target_humidity_max, target_soil_moisture_min,
        target_soil_moisture_max, target_ec_min, target_ec_max, notes_json,
        device_state_json, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      greenhouseId,
      managerUserId,
      Number(payload.area),
      deviceTotalCount,
      onlineDeviceCount,
      payload.strategy.trim(),
      createdAt,
      targets.targetTempMin,
      targets.targetTempMax,
      targets.targetHumidityMin,
      targets.targetHumidityMax,
      targets.targetSoilMoistureMin,
      targets.targetSoilMoistureMax,
      targets.targetEcMin,
      targets.targetEcMax,
      JSON.stringify([
        '请在正式投运前完成一次设备联调。',
        '新接入棚室建议在 24 小时内完成阈值复核。',
      ]),
      JSON.stringify({
        irrigation: false,
        nutrientPump: false,
        fillLight: false,
        ventilation: 0,
        shadeScreen: 0,
      }),
      createdAt,
    );

    createSensorSnapshot(db, greenhouseId, {
      recordedAt: createdAt,
      temp,
      humidity,
      soilMoisture,
      ec,
      lightLux: 0,
      co2Ppm: 0,
    });

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'greenhouse',
      entityId: greenhouseId,
      action: 'create',
      summary: `新增棚室 ${greenhouseName}`,
      details: {
        cropName,
        growthStage,
        manager: payload.manager,
        strategy: payload.strategy,
      },
    });

    return buildGreenhouseDetail(db, greenhouseId);
  })();
}

export function updateGreenhouseControl(actorUserId, greenhouseId, controlPayload) {
  const db = getDb();

  return db.transaction(() => {
    getUserContext(db, actorUserId);
    const greenhouse = getGreenhouseBaseRow(db, greenhouseId);
    const currentDevices = parseJson(greenhouse.device_state_json, {});
    const nextDevices = {
      irrigation: Boolean(controlPayload.irrigation),
      nutrientPump: Boolean(controlPayload.nutrientPump),
      fillLight: Boolean(controlPayload.fillLight),
      ventilation: Number(controlPayload.ventilation),
      shadeScreen: Number(controlPayload.shadeScreen),
    };
    const status = greenhouse.status === 'offline' ? 'queued' : 'success';
    const recordedAt = nowIso();

    const nextHumidity = Number(
      Math.max(45, greenhouse.humidity - (nextDevices.ventilation > 60 ? 6 : nextDevices.ventilation > 30 ? 3 : 0)).toFixed(1),
    );
    const nextSoilMoisture = Number(
      Math.min(45, greenhouse.soil_moisture + (nextDevices.irrigation ? 3 : 0)).toFixed(1),
    );
    const nextTemp = Number(
      (
        greenhouse.temp +
        (nextDevices.fillLight ? 0.4 : 0) -
        (nextDevices.shadeScreen > 50 ? 0.6 : nextDevices.shadeScreen > 20 ? 0.2 : 0)
      ).toFixed(1),
    );
    const nextEc = Number(
      Math.max(0.8, greenhouse.ec + (nextDevices.nutrientPump ? 0.1 : -0.05)).toFixed(1),
    );
    const activeAlertCount = db
      .prepare("SELECT COUNT(*) AS count FROM alerts WHERE greenhouse_id = ? AND resolved = 0 AND status = 'active'")
      .get(greenhouseId).count;
    const nextStatus = computeGreenhouseStatus(greenhouse.status, nextHumidity, nextSoilMoisture, activeAlertCount);

    db.prepare(`
      UPDATE greenhouses
      SET temp = ?, humidity = ?, soil_moisture = ?, ec = ?, status = ?, updated_at = ?, last_collected_at = ?
      WHERE id = ?
    `).run(nextTemp, nextHumidity, nextSoilMoisture, nextEc, nextStatus, recordedAt, recordedAt, greenhouseId);

    db.prepare(`
      UPDATE greenhouse_profiles
      SET device_state_json = ?, updated_at = ?
      WHERE greenhouse_id = ?
    `).run(JSON.stringify(nextDevices), recordedAt, greenhouseId);

    const changedEntries = [
      {
        key: 'irrigation',
        changed: currentDevices.irrigation !== nextDevices.irrigation,
        actionType: 'irrigation',
        target: '灌溉主阀',
        command: nextDevices.irrigation ? 'IRRIGATION_ON' : 'IRRIGATION_OFF',
        resultMessage: nextDevices.irrigation ? '滴灌已开启' : '滴灌已关闭',
        metadata: { enabled: nextDevices.irrigation },
      },
      {
        key: 'nutrientPump',
        changed: currentDevices.nutrientPump !== nextDevices.nutrientPump,
        actionType: 'fertigation',
        target: '营养液泵',
        command: nextDevices.nutrientPump ? 'NUTRIENT_PUMP_ON' : 'NUTRIENT_PUMP_OFF',
        resultMessage: nextDevices.nutrientPump ? '营养液泵已开启' : '营养液泵已关闭',
        metadata: { enabled: nextDevices.nutrientPump },
      },
      {
        key: 'fillLight',
        changed: currentDevices.fillLight !== nextDevices.fillLight,
        actionType: 'lighting',
        target: '补光系统',
        command: nextDevices.fillLight ? 'FILL_LIGHT_ON' : 'FILL_LIGHT_OFF',
        resultMessage: nextDevices.fillLight ? '补光系统已启用' : '补光系统已关闭',
        metadata: { enabled: nextDevices.fillLight },
      },
      {
        key: 'ventilation',
        changed: Number(currentDevices.ventilation ?? 0) !== nextDevices.ventilation,
        actionType: 'environment',
        target: '顶部通风',
        command: 'VENT_OPENING_SET',
        resultMessage: `顶部通风已设置为 ${nextDevices.ventilation}%`,
        metadata: { openingRatio: nextDevices.ventilation },
      },
      {
        key: 'shadeScreen',
        changed: Number(currentDevices.shadeScreen ?? 0) !== nextDevices.shadeScreen,
        actionType: 'environment',
        target: '遮阳 / 保温幕',
        command: 'SHADE_SCREEN_SET',
        resultMessage: `遮阳 / 保温幕已设置为 ${nextDevices.shadeScreen}%`,
        metadata: { openingRatio: nextDevices.shadeScreen },
      },
    ];

    changedEntries.filter((entry) => entry.changed).forEach((entry) => {
      insertControlLog(db, {
        greenhouseId,
        userId: actorUserId,
        actionType: entry.actionType,
        target: entry.target,
        command: entry.command,
        status,
        resultMessage: entry.resultMessage,
        metadata: entry.metadata,
      });
    });

    if (nextDevices.irrigation) {
      insertIrrigationEvent(db, {
        greenhouseId,
        userId: actorUserId,
        triggerSource: 'manual',
        durationMinutes: 12,
        waterVolume: 0.9,
        notes: '设备控制台执行短脉冲补灌',
      });
    }

    createSensorSnapshot(db, greenhouseId, {
      recordedAt,
      temp: nextTemp,
      humidity: nextHumidity,
      soilMoisture: nextSoilMoisture,
      ec: nextEc,
      lightLux: nextDevices.fillLight ? 12800 : 4200,
      co2Ppm: 500,
    });

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'greenhouse',
      entityId: greenhouseId,
      action: 'control.update',
      summary: `更新 ${greenhouse.name} 设备控制参数`,
      details: nextDevices,
    });

    return buildGreenhouseDetail(db, greenhouseId);
  })();
}

export function listAlerts() {
  const db = getDb();
  return db
    .prepare(`
      SELECT a.*, g.name AS greenhouse_name, ru.name AS resolved_by_name
      FROM alerts a
      LEFT JOIN greenhouses g ON g.id = a.greenhouse_id
      LEFT JOIN users ru ON ru.id = a.resolved_by_user_id
      ORDER BY CASE WHEN a.resolved = 0 THEN 0 ELSE 1 END, datetime(a.occurred_at) DESC, a.id DESC
    `)
    .all()
    .map(mapAlertRow);
}

export function resolveAlert(actorUserId, alertId) {
  const db = getDb();

  return db.transaction(() => {
    const actor = getUserContext(db, actorUserId);
    const alert = getAlertRowById(db, alertId);
    const resolvedAt = nowIso();

    db.prepare(`
      UPDATE alerts
      SET status = 'resolved', resolved = 1, resolved_at = ?, resolved_by_user_id = ?,
          resolution_note = COALESCE(resolution_note, '已在报警中心完成处置'), updated_at = ?
      WHERE id = ?
    `).run(resolvedAt, actor.id, resolvedAt, alertId);

    if (alert.greenhouse_id) {
      refreshGreenhouseStatus(db, alert.greenhouse_id);
    }

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'alert',
      entityId: alertId,
      action: 'resolve',
      summary: `处理报警：${alert.content}`,
      details: { level: alert.level, greenhouseId: alert.greenhouse_id },
    });

    return mapAlertRow(getAlertRowById(db, alertId));
  })();
}

export function resolveAllAlerts(actorUserId, filterType = '全部') {
  const db = getDb();

  return db.transaction(() => {
    const actor = getUserContext(db, actorUserId);
    const rows = db
      .prepare(`
        SELECT id, greenhouse_id, content
        FROM alerts
        WHERE resolved = 0 AND status = 'active' AND (? = '全部' OR type = ?)
        ORDER BY datetime(occurred_at) DESC, id DESC
      `)
      .all(filterType, filterType);

    if (!rows.length) {
      return { updatedCount: 0 };
    }

    const resolvedAt = nowIso();
    const updateAlert = db.prepare(`
      UPDATE alerts
      SET status = 'resolved', resolved = 1, resolved_at = ?, resolved_by_user_id = ?,
          resolution_note = '批量处置完成', updated_at = ?
      WHERE id = ?
    `);

    rows.forEach((row) => updateAlert.run(resolvedAt, actor.id, resolvedAt, row.id));
    [...new Set(rows.map((row) => row.greenhouse_id).filter(Boolean))].forEach((greenhouseId) => refreshGreenhouseStatus(db, greenhouseId));

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'alert',
      action: 'resolve_all',
      summary: filterType === '全部' ? '批量处理全部活动报警' : `批量处理 ${filterType}`,
      details: { updatedCount: rows.length },
    });

    return { updatedCount: rows.length };
  })();
}

export function exportAlerts(actorUserId, filterType = '全部') {
  const db = getDb();
  getUserContext(db, actorUserId);
  const items = listAlerts().filter((item) => filterType === '全部' || item.type === filterType);
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const lines = [
    ['ID', '棚室', '类型', '等级', '状态', '发生时间', '内容', '处理说明'].map(escapeCell).join(','),
    ...items.map((item) =>
      [
        item.id,
        item.greenhouseName ?? '未关联棚室',
        item.type,
        item.level,
        item.resolved ? '已处理' : '待处理',
        item.time,
        item.content,
        item.resolutionNote ?? '',
      ]
        .map(escapeCell)
        .join(','),
    ),
  ];

  insertActivityLog(db, {
    userId: actorUserId,
    entityType: 'alert',
    action: 'export',
    summary: filterType === '全部' ? '导出报警记录' : `导出 ${filterType} 报警记录`,
    details: { count: items.length },
  });

  return {
    fileName: `alerts-${todayDateString()}-${filterType}.csv`,
    content: lines.join('\n'),
    count: items.length,
  };
}

export function getDashboardBundle() {
  const db = getDb();
  const today = todayDateString();
  const totalGreenhouses = db.prepare('SELECT COUNT(*) AS count FROM greenhouses').get().count;
  const onlineDevices = db.prepare('SELECT COALESCE(SUM(online_device_count), 0) AS count FROM greenhouses').get().count;
  const activeAlerts = db
    .prepare("SELECT COUNT(*) AS count FROM alerts WHERE resolved = 0 AND status = 'active'")
    .get().count;
  const todayIrrigations = db
    .prepare('SELECT COUNT(*) AS count FROM irrigation_events WHERE substr(started_at, 1, 10) = ?')
    .get(today).count;

  const decisions = db
    .prepare(`
      SELECT d.*, g.name AS greenhouse_name
      FROM decisions d
      INNER JOIN greenhouses g ON g.id = d.greenhouse_id
      WHERE d.status != 'ignored'
      ORDER BY CASE WHEN d.status = 'pending' THEN 0 ELSE 1 END, datetime(d.created_at) DESC, d.id DESC
      LIMIT 2
    `)
    .all()
    .map(mapDecisionRow);

  const alerts = listAlerts().filter((alert) => [1, 2, 3].includes(alert.id));
  const greenhouseSummaries = listGreenhouses();
  const greenhousePreviewIds = [1, 2, 3];
  const greenhouses = greenhousePreviewIds
    .map((greenhouseId) => greenhouseSummaries.find((item) => item.id === greenhouseId))
    .filter(Boolean);

  return {
    kpis: {
      totalGreenhouses,
      onlineDevices,
      activeAlerts,
      todayIrrigations,
    },
    decisions,
    alerts,
    greenhouses,
  };
}

export function approveDecision(actorUserId, decisionId) {
  const db = getDb();

  return db.transaction(() => {
    const actor = getUserContext(db, actorUserId);
    const decision = getDecisionRowById(db, decisionId);
    const actedAt = nowIso();

    db.prepare(`
      UPDATE decisions
      SET status = 'approved', acted_by_user_id = ?, acted_at = ?, updated_at = ?
      WHERE id = ?
    `).run(actor.id, actedAt, actedAt, decisionId);

    const greenhouse = getGreenhouseBaseRow(db, decision.greenhouse_id);
    const devices = parseJson(greenhouse.device_state_json, {
      irrigation: false,
      nutrientPump: false,
      fillLight: false,
      ventilation: 0,
      shadeScreen: 0,
    });

    let nextHumidity = greenhouse.humidity;
    let nextSoilMoisture = greenhouse.soil_moisture;
    let nextTemp = greenhouse.temp;
    let nextEc = greenhouse.ec;
    const controlStatus = greenhouse.status === 'offline' ? 'queued' : 'success';

    insertControlLog(db, {
      greenhouseId: greenhouse.id,
      userId: actor.id,
      actionType: 'decision',
      target: decision.type,
      command: 'DECISION_EXECUTE',
      status: controlStatus,
      resultMessage: `已执行决策：${decision.action}`,
      metadata: { decisionId: decision.id },
    });

    if (decision.type.includes('灌溉') || decision.action.includes('滴灌')) {
      const durationMatch = decision.action.match(/(\d+)\s*分钟/);
      const durationMinutes = Number(durationMatch?.[1] ?? 20);
      nextSoilMoisture = Number(Math.min(45, greenhouse.soil_moisture + 3).toFixed(1));
      nextEc = Number(Math.min(3.5, greenhouse.ec + 0.1).toFixed(1));
      devices.irrigation = true;
      devices.nutrientPump = true;
      insertIrrigationEvent(db, {
        greenhouseId: greenhouse.id,
        decisionId: decision.id,
        userId: actor.id,
        triggerSource: 'ai',
        durationMinutes,
        waterVolume: Number((durationMinutes * 0.09).toFixed(1)),
        notes: `决策中心执行：${decision.action}`,
      });
    }

    if (decision.type.includes('环境调控') || decision.action.includes('通风')) {
      nextHumidity = Number(Math.max(48, greenhouse.humidity - 5).toFixed(1));
      nextTemp = Number(Math.max(18, greenhouse.temp - 0.3).toFixed(1));
      devices.ventilation = 45;
    }

    const activeAlertCount = db
      .prepare("SELECT COUNT(*) AS count FROM alerts WHERE greenhouse_id = ? AND resolved = 0 AND status = 'active'")
      .get(greenhouse.id).count;
    const nextStatus = computeGreenhouseStatus(greenhouse.status, nextHumidity, nextSoilMoisture, activeAlertCount);

    db.prepare(`
      UPDATE greenhouses
      SET temp = ?, humidity = ?, soil_moisture = ?, ec = ?, status = ?, irrigation_mode = 'assisted', updated_at = ?, last_collected_at = ?
      WHERE id = ?
    `).run(nextTemp, nextHumidity, nextSoilMoisture, nextEc, nextStatus, actedAt, actedAt, greenhouse.id);

    db.prepare('UPDATE greenhouse_profiles SET device_state_json = ?, updated_at = ? WHERE greenhouse_id = ?').run(
      JSON.stringify(devices),
      actedAt,
      greenhouse.id,
    );

    createSensorSnapshot(db, greenhouse.id, {
      recordedAt: actedAt,
      temp: nextTemp,
      humidity: nextHumidity,
      soilMoisture: nextSoilMoisture,
      ec: nextEc,
      lightLux: devices.fillLight ? 12600 : 5400,
      co2Ppm: 520,
    });

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'decision',
      entityId: decisionId,
      action: 'approve',
      summary: `执行决策：${decision.action}`,
      details: { greenhouseId: decision.greenhouse_id, type: decision.type },
    });

    return mapDecisionRow(getDecisionRowById(db, decisionId));
  })();
}

export function ignoreDecision(actorUserId, decisionId) {
  const db = getDb();

  return db.transaction(() => {
    getUserContext(db, actorUserId);
    const decision = getDecisionRowById(db, decisionId);
    const updatedAt = nowIso();

    db.prepare(`
      UPDATE decisions
      SET status = 'ignored', acted_by_user_id = ?, acted_at = ?, updated_at = ?
      WHERE id = ?
    `).run(actorUserId, updatedAt, updatedAt, decisionId);

    insertActivityLog(db, {
      userId: actorUserId,
      entityType: 'decision',
      entityId: decisionId,
      action: 'ignore',
      summary: `忽略决策：${decision.action}`,
      details: { greenhouseId: decision.greenhouse_id, type: decision.type },
    });

    return mapDecisionRow(getDecisionRowById(db, decisionId));
  })();
}
