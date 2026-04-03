import { pathToFileURL } from 'node:url';
import { initializeDatabase } from './init.js';

function isDirectExecution() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

export function verifyDatabase(db = initializeDatabase()) {
  const counts = {
    parks: db.prepare('SELECT COUNT(*) AS value FROM parks').get().value,
    users: db.prepare('SELECT COUNT(*) AS value FROM users').get().value,
    greenhouses: db.prepare('SELECT COUNT(*) AS value FROM greenhouses').get().value,
    alerts: db.prepare('SELECT COUNT(*) AS value FROM alerts').get().value,
    decisions: db.prepare('SELECT COUNT(*) AS value FROM decisions').get().value,
    experiments: db.prepare('SELECT COUNT(*) AS value FROM experiments').get().value,
  };

  const dashboard = db
    .prepare(`
      SELECT
        (SELECT COUNT(*) FROM greenhouses) AS totalGreenhouses,
        (SELECT COALESCE(SUM(online_device_count), 0) FROM greenhouses) AS onlineDevices,
        (SELECT COUNT(*) FROM alerts WHERE status = 'active' AND resolved = 0) AS activeAlerts,
        (SELECT COUNT(*) FROM irrigation_events WHERE substr(started_at, 1, 10) = '2026-04-03') AS todayIrrigations
    `)
    .get();

  return { counts, dashboard };
}

if (isDirectExecution()) {
  const db = initializeDatabase();
  const result = verifyDatabase(db);
  console.log(JSON.stringify(result, null, 2));
  db.close();
}
