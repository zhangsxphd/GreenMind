import {
  createGreenhouse,
  getGreenhouseDetail,
  listGreenhouses,
  updateGreenhouseControl,
} from '../repositories/operationsRepository.js';
import { asNumber, handleRepositoryError } from './route-utils.js';

export async function greenhouseRoutes(app) {
  app.get('/', async () => ({ items: listGreenhouses() }));

  app.get('/:greenhouseId', async (request, reply) => {
    const greenhouseId = asNumber(request.params.greenhouseId);

    if (!greenhouseId) {
      reply.code(400).send({ message: 'greenhouseId is required' });
      return;
    }

    try {
      return { item: getGreenhouseDetail(greenhouseId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.post('/', async (request, reply) => {
    const actorUserId = asNumber(request.body?.actorUserId);

    if (!actorUserId) {
      reply.code(400).send({ message: 'actorUserId is required' });
      return;
    }

    try {
      return { item: createGreenhouse(actorUserId, request.body) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.put('/:greenhouseId/control', async (request, reply) => {
    const greenhouseId = asNumber(request.params.greenhouseId);
    const actorUserId = asNumber(request.body?.actorUserId);
    const controlSettings = request.body?.controlSettings;

    if (!greenhouseId || !actorUserId || !controlSettings) {
      reply.code(400).send({ message: 'greenhouseId, actorUserId and controlSettings are required' });
      return;
    }

    try {
      return { item: updateGreenhouseControl(actorUserId, greenhouseId, controlSettings) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });
}
