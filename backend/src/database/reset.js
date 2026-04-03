import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { getDatabasePath } from './client.js';
import { initializeDatabase } from './init.js';
import { seedDatabase } from './seed.js';

function isDirectExecution() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

export function resetDatabase() {
  const dbPath = getDatabasePath();

  [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].forEach((target) => {
    fs.rmSync(target, { force: true });
  });

  const db = initializeDatabase();
  const summary = seedDatabase(db);
  db.close();

  return summary;
}

if (isDirectExecution()) {
  const summary = resetDatabase();
  console.log('Database reset and seeded:', summary);
}
