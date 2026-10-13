import * as SQLite from 'expo-sqlite';
import { SCHEMA_DDL } from './databaseSchema';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const DB_NAME = 'firetv_music.db';

/**
 * Initializes the SQLite database, establishes WAL mode, and creates required tables.
 * Safe to call multiple times (memoized promise).
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('[Database] Opening SQLite database:', DB_NAME);
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      // Execute schema definition
      await db.execAsync(SCHEMA_DDL);
      console.log('[Database] Schema initialized successfully with WAL mode.');

      dbInstance = db;
      return db;
    } catch (error) {
      console.error('[Database] Failed to initialize SQLite database:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Returns the active SQLite database instance, initializing if needed.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  return initDatabase();
}
