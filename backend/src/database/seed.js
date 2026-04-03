import { pathToFileURL } from 'node:url';
import { initializeDatabase } from './init.js';
import {
  activityLogs,
  alerts,
  configSnapshots,
  controlLogs,
  decisions,
  efficiencySnapshots,
  experimentDesigns,
  experiments,
  greenhouses,
  greenhouseProfiles,
  integrationServices,
  irrigationDaily,
  irrigationEvents,
  notificationSettings,
  operationsSettings,
  parks,
  phenotypeRecords,
  securitySettings,
  sensorReadings,
  systemRules,
  userPreferences,
  users,
} from './seed-data.js';

function isDirectExecution() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function clearTables(db) {
  db.exec(`
    DELETE FROM activity_logs;
    DELETE FROM config_snapshots;
    DELETE FROM operations_settings;
    DELETE FROM security_settings;
    DELETE FROM notification_settings;
    DELETE FROM user_preferences;
    DELETE FROM phenotype_records;
    DELETE FROM experiment_designs;
    DELETE FROM experiments;
    DELETE FROM control_logs;
    DELETE FROM irrigation_events;
    DELETE FROM alerts;
    DELETE FROM decisions;
    DELETE FROM sensor_readings;
    DELETE FROM analysis_irrigation_daily;
    DELETE FROM efficiency_snapshots;
    DELETE FROM system_rules;
    DELETE FROM integration_services;
    DELETE FROM greenhouse_profiles;
    DELETE FROM greenhouses;
    DELETE FROM users;
    DELETE FROM parks;
  `);
}

export function seedDatabase(db = initializeDatabase()) {
  const insertPark = db.prepare(`
    INSERT INTO parks (id, name, code, location, description, created_at, updated_at)
    VALUES (@id, @name, @code, @location, @description, @created_at, @updated_at)
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (id, park_id, name, role, avatar, phone, is_super_admin, created_at, updated_at)
    VALUES (@id, @park_id, @name, @role, @avatar, @phone, @is_super_admin, @created_at, @updated_at)
  `);

  const insertGreenhouse = db.prepare(`
    INSERT INTO greenhouses (
      id, park_id, name, code, zone_name, crop_name, growth_stage, structure_type,
      temp, humidity, soil_moisture, ec, status, online_device_count,
      irrigation_mode, last_collected_at, created_at, updated_at
    )
    VALUES (
      @id, @park_id, @name, @code, @zone_name, @crop_name, @growth_stage, @structure_type,
      @temp, @humidity, @soil_moisture, @ec, @status, @online_device_count,
      @irrigation_mode, @last_collected_at, @created_at, @updated_at
    )
  `);

  const insertGreenhouseProfile = db.prepare(`
    INSERT INTO greenhouse_profiles (
      greenhouse_id, manager_user_id, area_sqm, device_total_count, device_online_count,
      irrigation_strategy, last_service_at, target_temp_min, target_temp_max,
      target_humidity_min, target_humidity_max, target_soil_moisture_min,
      target_soil_moisture_max, target_ec_min, target_ec_max, notes_json,
      device_state_json, updated_at
    )
    VALUES (
      @greenhouse_id, @manager_user_id, @area_sqm, @device_total_count, @device_online_count,
      @irrigation_strategy, @last_service_at, @target_temp_min, @target_temp_max,
      @target_humidity_min, @target_humidity_max, @target_soil_moisture_min,
      @target_soil_moisture_max, @target_ec_min, @target_ec_max, @notes_json,
      @device_state_json, @updated_at
    )
  `);

  const insertSensorReading = db.prepare(`
    INSERT INTO sensor_readings (
      id, greenhouse_id, recorded_at, temp, humidity, soil_moisture, ec, light_lux, co2_ppm
    )
    VALUES (
      @id, @greenhouse_id, @recorded_at, @temp, @humidity, @soil_moisture, @ec, @light_lux, @co2_ppm
    )
  `);

  const insertDecision = db.prepare(`
    INSERT INTO decisions (
      id, greenhouse_id, type, action, confidence, reason, status,
      created_by, acted_by_user_id, acted_at, created_at, updated_at
    )
    VALUES (
      @id, @greenhouse_id, @type, @action, @confidence, @reason, @status,
      @created_by, @acted_by_user_id, @acted_at, @created_at, @updated_at
    )
  `);

  const insertAlert = db.prepare(`
    INSERT INTO alerts (
      id, greenhouse_id, type, level, content, status, resolved,
      occurred_at, resolved_at, resolved_by_user_id, resolution_note, created_at, updated_at
    )
    VALUES (
      @id, @greenhouse_id, @type, @level, @content, @status, @resolved,
      @occurred_at, @resolved_at, @resolved_by_user_id, @resolution_note, @created_at, @updated_at
    )
  `);

  const insertIrrigationEvent = db.prepare(`
    INSERT INTO irrigation_events (
      id, greenhouse_id, decision_id, initiated_by_user_id, trigger_source,
      duration_minutes, water_volume_m3, started_at, completed_at, notes
    )
    VALUES (
      @id, @greenhouse_id, @decision_id, @initiated_by_user_id, @trigger_source,
      @duration_minutes, @water_volume_m3, @started_at, @completed_at, @notes
    )
  `);

  const insertControlLog = db.prepare(`
    INSERT INTO control_logs (
      id, greenhouse_id, user_id, action_type, target, command,
      status, requested_at, executed_at, result_message, metadata_json
    )
    VALUES (
      @id, @greenhouse_id, @user_id, @action_type, @target, @command,
      @status, @requested_at, @executed_at, @result_message, @metadata_json
    )
  `);

  const insertExperiment = db.prepare(`
    INSERT INTO experiments (
      id, park_id, lead_user_id, greenhouse_id, name, crop_name,
      treatments, replicates, status, start_date, ai_enabled,
      summary, created_at, updated_at
    )
    VALUES (
      @id, @park_id, @lead_user_id, @greenhouse_id, @name, @crop_name,
      @treatments, @replicates, @status, @start_date, @ai_enabled,
      @summary, @created_at, @updated_at
    )
  `);

  const insertExperimentDesign = db.prepare(`
    INSERT INTO experiment_designs (id, experiment_id, layout_json, updated_by_user_id, updated_at)
    VALUES (@id, @experiment_id, @layout_json, @updated_by_user_id, @updated_at)
  `);

  const insertPhenotypeRecord = db.prepare(`
    INSERT INTO phenotype_records (
      id, experiment_id, sample_code, trait_name, trait_value,
      unit, recorded_at, recorded_by_user_id
    )
    VALUES (
      @id, @experiment_id, @sample_code, @trait_name, @trait_value,
      @unit, @recorded_at, @recorded_by_user_id
    )
  `);

  const insertIrrigationDaily = db.prepare(`
    INSERT INTO analysis_irrigation_daily (id, scope_type, scope_ref, record_date, water_usage_m3)
    VALUES (@id, @scope_type, @scope_ref, @record_date, @water_usage_m3)
  `);

  const insertEfficiencySnapshot = db.prepare(`
    INSERT INTO efficiency_snapshots (
      id, scope_type, scope_ref, metric_key, metric_label,
      score_label, score_percent, record_month, insight_text, created_at
    )
    VALUES (
      @id, @scope_type, @scope_ref, @metric_key, @metric_label,
      @score_label, @score_percent, @record_month, @insight_text, @created_at
    )
  `);

  const insertSystemRule = db.prepare(`
    INSERT INTO system_rules (
      id, code, category, name, description, value_type, numeric_value,
      boolean_value, text_value, unit, comparison_operator,
      duration_minutes, action_mode, enabled, updated_by_user_id, updated_at
    )
    VALUES (
      @id, @code, @category, @name, @description, @value_type, @numeric_value,
      @boolean_value, @text_value, @unit, @comparison_operator,
      @duration_minutes, @action_mode, @enabled, @updated_by_user_id, @updated_at
    )
  `);

  const insertUserPreference = db.prepare(`
    INSERT INTO user_preferences (
      user_id, email, title, affiliation, timezone, language,
      default_scope, start_page, avatar_theme, compact_dashboard,
      auto_open_analysis, updated_at
    )
    VALUES (
      @user_id, @email, @title, @affiliation, @timezone, @language,
      @default_scope, @start_page, @avatar_theme, @compact_dashboard,
      @auto_open_analysis, @updated_at
    )
  `);

  const insertNotificationSetting = db.prepare(`
    INSERT INTO notification_settings (
      id, in_app, sms, email, wecom, daily_report,
      quiet_hours_enabled, quiet_start, quiet_end, escalation_receiver,
      report_frequency, last_test_channel, updated_by_user_id, updated_at
    )
    VALUES (
      @id, @in_app, @sms, @email, @wecom, @daily_report,
      @quiet_hours_enabled, @quiet_start, @quiet_end, @escalation_receiver,
      @report_frequency, @last_test_channel, @updated_by_user_id, @updated_at
    )
  `);

  const insertSecuritySetting = db.prepare(`
    INSERT INTO security_settings (
      id, retention_days, backup_frequency, backup_compression, mfa_required,
      api_read_only_mode, session_timeout, auto_export_alerts,
      token_version, last_backup, updated_by_user_id, updated_at
    )
    VALUES (
      @id, @retention_days, @backup_frequency, @backup_compression, @mfa_required,
      @api_read_only_mode, @session_timeout, @auto_export_alerts,
      @token_version, @last_backup, @updated_by_user_id, @updated_at
    )
  `);

  const insertOperationsSetting = db.prepare(`
    INSERT INTO operations_settings (
      id, maintenance_mode, maintenance_window, auto_health_check,
      updated_by_user_id, updated_at
    )
    VALUES (
      @id, @maintenance_mode, @maintenance_window, @auto_health_check,
      @updated_by_user_id, @updated_at
    )
  `);

  const insertIntegrationService = db.prepare(`
    INSERT INTO integration_services (
      id, code, name, type, endpoint, status,
      enabled, response_time_ms, last_heartbeat_at, config_json, updated_at
    )
    VALUES (
      @id, @code, @name, @type, @endpoint, @status,
      @enabled, @response_time_ms, @last_heartbeat_at, @config_json, @updated_at
    )
  `);

  const insertConfigSnapshot = db.prepare(`
    INSERT INTO config_snapshots (id, name, status, payload_json, created_by_user_id, created_at)
    VALUES (@id, @name, @status, @payload_json, @created_by_user_id, @created_at)
  `);

  const insertActivityLog = db.prepare(`
    INSERT INTO activity_logs (
      id, user_id, entity_type, entity_id, action, summary, details_json, archived, occurred_at
    )
    VALUES (
      @id, @user_id, @entity_type, @entity_id, @action, @summary, @details_json, @archived, @occurred_at
    )
  `);

  const transaction = db.transaction(() => {
    clearTables(db);

    parks.forEach((item) => insertPark.run(item));
    users.forEach((item) => insertUser.run(item));
    userPreferences.forEach((item) => insertUserPreference.run(item));
    greenhouses.forEach((item) => insertGreenhouse.run(item));
    greenhouseProfiles.forEach((item) =>
      insertGreenhouseProfile.run({
        ...item,
        notes_json: JSON.stringify(item.notes_json),
        device_state_json: JSON.stringify(item.device_state_json),
      }),
    );
    sensorReadings.forEach((item) => insertSensorReading.run(item));
    decisions.forEach((item) => insertDecision.run(item));
    alerts.forEach((item) => insertAlert.run(item));
    irrigationEvents.forEach((item) => insertIrrigationEvent.run(item));
    controlLogs.forEach((item) => insertControlLog.run({ ...item, metadata_json: JSON.stringify(item.metadata_json) }));
    experiments.forEach((item) => insertExperiment.run(item));
    experimentDesigns.forEach((item) =>
      insertExperimentDesign.run({ ...item, layout_json: JSON.stringify(item.layout_json) }),
    );
    phenotypeRecords.forEach((item) => insertPhenotypeRecord.run(item));
    irrigationDaily.forEach((item) => insertIrrigationDaily.run(item));
    efficiencySnapshots.forEach((item) => insertEfficiencySnapshot.run(item));
    systemRules.forEach((item) => insertSystemRule.run(item));
    notificationSettings.forEach((item) => insertNotificationSetting.run(item));
    securitySettings.forEach((item) => insertSecuritySetting.run(item));
    operationsSettings.forEach((item) => insertOperationsSetting.run(item));
    integrationServices.forEach((item) =>
      insertIntegrationService.run({ ...item, config_json: JSON.stringify(item.config_json) }),
    );
    configSnapshots.forEach((item) =>
      insertConfigSnapshot.run({ ...item, payload_json: JSON.stringify(item.payload_json) }),
    );
    activityLogs.forEach((item) =>
      insertActivityLog.run({
        ...item,
        archived: item.archived ?? 0,
        details_json: JSON.stringify(item.details_json),
      }),
    );
  });

  transaction();

  return {
    parks: parks.length,
    users: users.length,
    greenhouses: greenhouses.length,
    greenhouseProfiles: greenhouseProfiles.length,
    sensorReadings: sensorReadings.length,
    alerts: alerts.length,
    decisions: decisions.length,
    irrigationEvents: irrigationEvents.length,
    experiments: experiments.length,
    phenotypeRecords: phenotypeRecords.length,
    rules: systemRules.length,
    integrations: integrationServices.length,
    snapshots: configSnapshots.length,
  };
}

if (isDirectExecution()) {
  const db = initializeDatabase();
  const summary = seedDatabase(db);
  console.log('Seed completed:', summary);
  db.close();
}
