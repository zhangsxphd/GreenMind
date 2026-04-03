import { approveDecision, ignoreDecision } from '../repositories/operationsRepository.js';
import { asNumber, handleRepositoryError } from './route-utils.js';

export async function decisionRoutes(app) {
  app.post('/:decisionId/approve', async (request, reply) => {
    const decisionId = asNumber(request.params.decisionId);
    const actorUserId = asNumber(request.body?.actorUserId);

    if (!decisionId || !actorUserId) {
      reply.code(400).send({ message: 'decisionId and actorUserId are required' });
      return;
    }

    try {
      return { item: approveDecision(actorUserId, decisionId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.post('/:decisionId/ignore', async (request, reply) => {
    const decisionId = asNumber(request.params.decisionId);
    const actorUserId = asNumber(request.body?.actorUserId);

    if (!decisionId || !actorUserId) {
      reply.code(400).send({ message: 'decisionId and actorUserId are required' });
      return;
    }

    try {
      return { item: ignoreDecision(actorUserId, decisionId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });
}
