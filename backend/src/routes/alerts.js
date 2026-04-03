import { exportAlerts, listAlerts, resolveAlert, resolveAllAlerts } from '../repositories/operationsRepository.js';
import { asNumber, handleRepositoryError } from './route-utils.js';

export async function alertRoutes(app) {
  app.get('/', async () => ({ items: listAlerts() }));

  app.put('/resolve-all', async (request, reply) => {
    const actorUserId = asNumber(request.body?.actorUserId);
    const filterType = request.body?.filterType ?? '全部';

    if (!actorUserId) {
      reply.code(400).send({ message: 'actorUserId is required' });
      return;
    }

    return resolveAllAlerts(actorUserId, filterType);
  });

  app.post('/export', async (request, reply) => {
    const actorUserId = asNumber(request.body?.actorUserId);
    const filterType = request.body?.filterType ?? '全部';

    if (!actorUserId) {
      reply.code(400).send({ message: 'actorUserId is required' });
      return;
    }

    return exportAlerts(actorUserId, filterType);
  });

  app.put('/:alertId/resolve', async (request, reply) => {
    const alertId = asNumber(request.params.alertId);
    const actorUserId = asNumber(request.body?.actorUserId);

    if (!alertId || !actorUserId) {
      reply.code(400).send({ message: 'alertId and actorUserId are required' });
      return;
    }

    try {
      return { item: resolveAlert(actorUserId, alertId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });
}
