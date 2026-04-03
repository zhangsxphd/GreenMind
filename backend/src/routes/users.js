import { listUsers } from '../repositories/settingsRepository.js';

export async function userRoutes(app) {
  app.get('/', async () => ({
    items: listUsers(),
  }));
}
