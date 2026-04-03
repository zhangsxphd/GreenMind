import api from '../lib/api';

export async function fetchUsers() {
  const { data } = await api.get('/users');
  return data.items ?? [];
}
