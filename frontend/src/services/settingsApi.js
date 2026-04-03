import api from '../lib/api';

function unwrap(response) {
  return response.data.settings;
}

export async function fetchSettings(userId) {
  const { data } = await api.get('/settings', { params: { userId } });
  return data;
}

export async function saveBasicSettingsRequest(userId, basicSettings) {
  return unwrap(await api.put('/settings/basic', { userId, basicSettings }));
}

export async function saveRuleSettingsRequest(userId, actorUserId, ruleSettings) {
  return unwrap(await api.put('/settings/rules', { userId, actorUserId, ruleSettings }));
}

export async function simulateRuleSettingsRequest(userId, actorUserId) {
  const { data } = await api.post('/settings/rules/simulate', { userId, actorUserId });
  return data;
}

export async function saveNotificationSettingsRequest(userId, actorUserId, notificationSettings) {
  return unwrap(await api.put('/settings/notifications', { userId, actorUserId, notificationSettings }));
}

export async function testNotificationChannelRequest(userId, actorUserId, channel) {
  return unwrap(await api.post('/settings/notifications/test', { userId, actorUserId, channel }));
}

export async function saveSecuritySettingsRequest(userId, actorUserId, securitySettings) {
  return unwrap(await api.put('/settings/security', { userId, actorUserId, securitySettings }));
}

export async function createBackupRequest(userId, actorUserId) {
  return unwrap(await api.post('/settings/security/backup', { userId, actorUserId }));
}

export async function rotateSecurityTokenRequest(userId, actorUserId) {
  return unwrap(await api.post('/settings/security/rotate-token', { userId, actorUserId }));
}

export async function saveOpsSettingsRequest(userId, actorUserId, opsSettings) {
  return unwrap(await api.put('/settings/ops', { userId, actorUserId, opsSettings }));
}

export async function runHealthCheckRequest(userId, actorUserId) {
  return unwrap(await api.post('/settings/ops/health-check', { userId, actorUserId }));
}

export async function exportSettingsPackageRequest(userId, actorUserId) {
  return unwrap(await api.post('/settings/export', { userId, actorUserId }));
}

export async function toggleIntegrationRequest(userId, actorUserId, integrationId) {
  return unwrap(await api.post(`/settings/integrations/${integrationId}/toggle`, { userId, actorUserId }));
}

export async function testIntegrationRequest(userId, actorUserId, integrationId) {
  return unwrap(await api.post(`/settings/integrations/${integrationId}/test`, { userId, actorUserId }));
}

export async function rotateIntegrationKeyRequest(userId, actorUserId, integrationId) {
  return unwrap(await api.post(`/settings/integrations/${integrationId}/rotate-key`, { userId, actorUserId }));
}

export async function createConfigSnapshotRequest(userId, actorUserId, name) {
  return unwrap(await api.post('/settings/snapshots', { userId, actorUserId, name }));
}

export async function restoreConfigSnapshotRequest(userId, actorUserId, snapshotId) {
  return unwrap(await api.post(`/settings/snapshots/${snapshotId}/restore`, { userId, actorUserId }));
}

export async function archiveActivityLogsRequest(userId, actorUserId) {
  return unwrap(await api.post('/settings/logs/archive', { userId, actorUserId }));
}
