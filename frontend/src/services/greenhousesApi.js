import api from '../lib/api';

export async function fetchGreenhouses() {
  const { data } = await api.get('/greenhouses');
  return data.items ?? [];
}

export async function fetchGreenhouseDetail(greenhouseId) {
  const { data } = await api.get(`/greenhouses/${greenhouseId}`);
  return data.item;
}

export async function createGreenhouseRequest(actorUserId, payload) {
  const { data } = await api.post('/greenhouses', { actorUserId, ...payload });
  return data.item;
}

export async function updateGreenhouseControlRequest(actorUserId, greenhouseId, controlSettings) {
  const { data } = await api.put(`/greenhouses/${greenhouseId}/control`, { actorUserId, controlSettings });
  return data.item;
}
