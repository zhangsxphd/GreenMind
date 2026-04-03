import api from '../lib/api';

export async function approveDecisionRequest(actorUserId, decisionId) {
  const { data } = await api.post(`/decisions/${decisionId}/approve`, { actorUserId });
  return data.item;
}

export async function ignoreDecisionRequest(actorUserId, decisionId) {
  const { data } = await api.post(`/decisions/${decisionId}/ignore`, { actorUserId });
  return data.item;
}
