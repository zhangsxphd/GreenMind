import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createDatabaseConnection, getDatabasePath } from './client.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(currentDir, 'schema.sql');

export function initializeDatabase() {
  const db = createDatabaseConnection();
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schema);

  return db;
}

function isDirectExecution() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectExecution()) {
  const db = initializeDatabase();
  console.log(`Database schema initialized: ${getDatabasePath()}`);
  db.close();
}
