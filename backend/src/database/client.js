import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, '../../data');
const dbPath = path.join(dataDir, 'smart-agri.db');

let dbInstance = null;

export function getDatabasePath() {
  return dbPath;
}

export function ensureDataDirectory() {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function createDatabaseConnection() {
  ensureDataDirectory();

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  return db;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDatabaseConnection();
  }

  return dbInstance;
}

export function closeDb() {
  if (!dbInstance) {
    return;
  }

  dbInstance.close();
  dbInstance = null;
}
