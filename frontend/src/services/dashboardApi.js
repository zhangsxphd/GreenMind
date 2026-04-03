import api from '../lib/api';

export async function fetchDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}
