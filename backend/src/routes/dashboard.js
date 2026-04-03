import { getDashboardBundle } from '../repositories/operationsRepository.js';

export async function dashboardRoutes(app) {
  app.get('/', async () => getDashboardBundle());
}
