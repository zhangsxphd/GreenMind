import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initializeDatabase } from './database/init.js';
import { alertRoutes } from './routes/alerts.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { decisionRoutes } from './routes/decisions.js';
import { greenhouseRoutes } from './routes/greenhouses.js';
import { settingsRoutes } from './routes/settings.js';
import { userRoutes } from './routes/users.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  initializeDatabase();

  await app.register(cors, {
    origin: true,
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'smart-agri-backend',
  }));

  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(greenhouseRoutes, { prefix: '/api/greenhouses' });
  await app.register(alertRoutes, { prefix: '/api/alerts' });
  await app.register(decisionRoutes, { prefix: '/api/decisions' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });

  return app;
}
