import api from '../lib/api';

export async function fetchAlerts() {
  const { data } = await api.get('/alerts');
  return data.items ?? [];
}

export async function resolveAlertRequest(actorUserId, alertId) {
  const { data } = await api.put(`/alerts/${alertId}/resolve`, { actorUserId });
  return data.item;
}

export async function resolveAllAlertsRequest(actorUserId, filterType) {
  const { data } = await api.put('/alerts/resolve-all', { actorUserId, filterType });
  return data;
}

export async function exportAlertsRequest(actorUserId, filterType) {
  const { data } = await api.post('/alerts/export', { actorUserId, filterType });
  return data;
}
