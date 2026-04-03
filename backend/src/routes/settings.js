import {
  archiveActivityLogs,
  createBackup,
  createConfigSnapshot,
  exportSettingsPackage,
  getSettingsBundle,
  restoreConfigSnapshot,
  rotateIntegrationKey,
  rotateSecurityToken,
  runHealthCheck,
  saveBasicSettings,
  saveNotificationSettings,
  saveOpsSettings,
  saveRuleSettings,
  saveSecuritySettings,
  simulateRuleSettings,
  testIntegration,
  testNotificationChannel,
  toggleIntegration,
} from '../repositories/settingsRepository.js';

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getUserIds(request) {
  const userId = asNumber(request.body?.userId ?? request.query?.userId);
  const actorUserId = asNumber(request.body?.actorUserId) ?? userId;

  return { userId, actorUserId };
}

function handleRepositoryError(reply, error) {
  if (error.message.includes('not found')) {
    reply.code(404).send({ message: error.message });
    return true;
  }

  return false;
}

export async function settingsRoutes(app) {
  app.get('/', async (request, reply) => {
    const userId = asNumber(request.query?.userId);

    if (!userId) {
      reply.code(400).send({ message: 'userId is required' });
      return;
    }

    try {
      return getSettingsBundle(userId);
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.put('/basic', async (request, reply) => {
    const { userId } = getUserIds(request);

    if (!userId || !request.body?.basicSettings) {
      reply.code(400).send({ message: 'userId and basicSettings are required' });
      return;
    }

    try {
      return { settings: saveBasicSettings(userId, request.body.basicSettings) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.put('/rules', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId || !request.body?.ruleSettings) {
      reply.code(400).send({ message: 'userId, actorUserId and ruleSettings are required' });
      return;
    }

    return { settings: saveRuleSettings(actorUserId, userId, request.body.ruleSettings) };
  });

  app.post('/rules/simulate', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    return simulateRuleSettings(actorUserId, userId);
  });

  app.put('/notifications', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId || !request.body?.notificationSettings) {
      reply.code(400).send({ message: 'userId, actorUserId and notificationSettings are required' });
      return;
    }

    return { settings: saveNotificationSettings(actorUserId, userId, request.body.notificationSettings) };
  });

  app.post('/notifications/test', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);
    const channel = request.body?.channel;

    if (!userId || !actorUserId || !channel) {
      reply.code(400).send({ message: 'userId, actorUserId and channel are required' });
      return;
    }

    return { settings: testNotificationChannel(actorUserId, userId, channel) };
  });

  app.put('/security', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId || !request.body?.securitySettings) {
      reply.code(400).send({ message: 'userId, actorUserId and securitySettings are required' });
      return;
    }

    return { settings: saveSecuritySettings(actorUserId, userId, request.body.securitySettings) };
  });

  app.post('/security/backup', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    return { settings: createBackup(actorUserId, userId) };
  });

  app.post('/security/rotate-token', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    return { settings: rotateSecurityToken(actorUserId, userId) };
  });

  app.put('/ops', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId || !request.body?.opsSettings) {
      reply.code(400).send({ message: 'userId, actorUserId and opsSettings are required' });
      return;
    }

    return { settings: saveOpsSettings(actorUserId, userId, request.body.opsSettings) };
  });

  app.post('/ops/health-check', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    return { settings: runHealthCheck(actorUserId, userId) };
  });

  app.post('/export', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    return { settings: exportSettingsPackage(actorUserId, userId) };
  });

  app.post('/integrations/:integrationId/toggle', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    try {
      return { settings: toggleIntegration(actorUserId, userId, request.params.integrationId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.post('/integrations/:integrationId/test', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    try {
      return { settings: testIntegration(actorUserId, userId, request.params.integrationId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.post('/integrations/:integrationId/rotate-key', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    try {
      return { settings: rotateIntegrationKey(actorUserId, userId, request.params.integrationId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.post('/snapshots', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    return { settings: createConfigSnapshot(actorUserId, userId, request.body?.name) };
  });

  app.post('/snapshots/:snapshotId/restore', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);
    const snapshotId = asNumber(request.params.snapshotId);

    if (!userId || !actorUserId || !snapshotId) {
      reply.code(400).send({ message: 'userId, actorUserId and snapshotId are required' });
      return;
    }

    try {
      return { settings: restoreConfigSnapshot(actorUserId, userId, snapshotId) };
    } catch (error) {
      if (!handleRepositoryError(reply, error)) {
        throw error;
      }
    }
  });

  app.post('/logs/archive', async (request, reply) => {
    const { userId, actorUserId } = getUserIds(request);

    if (!userId || !actorUserId) {
      reply.code(400).send({ message: 'userId and actorUserId are required' });
      return;
    }

    return { settings: archiveActivityLogs(actorUserId, userId) };
  });
}
