// src/lib/db.ts
import Database from '@tauri-apps/plugin-sql';

const DB_NAME = 'local_scribe.db';

export interface Note {
  id: number;
  content: string;
  created_at: string;
}

// Singleton instance to prevent multiple connections
let dbInstance: Database | null = null;

/**
 * Establishes or retrieves the active database connection.
 * Uses the Singleton pattern for efficiency.
 */
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  
  try {
    dbInstance = await Database.load(`sqlite:${DB_NAME}`);
    return dbInstance;
  } catch (error) {
    console.error('Failed to load database:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Initializes the database schema.
 * Should be called once on app startup.
 */
export async function initDb(): Promise<void> {
  const db = await getDb();
  
  // efficient: IF NOT EXISTS prevents errors on reload
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Adds a new note to the database.
 * @param content The text content of the note
 */
export async function addNote(content: string): Promise<void> {
  if (!content.trim()) return; // Efficiency: Don't save empty strings
  
  const db = await getDb();
  // Safe parameter binding ($1) prevents SQL Injection
  await db.execute('INSERT INTO notes (content) VALUES ($1)', [content]);
}

/**
 * Retrieves notes with optional pagination.
 * @param limit Max number of notes to fetch (Default: 50 for UI performance)
 */
export async function getNotes(limit: number = 50): Promise<Note[]> {
  const db = await getDb();
  return await db.select<Note[]>(
    'SELECT * FROM notes ORDER BY id DESC LIMIT $1', 
    [limit]
  );
}

// --- For Testing Only ---
export function _resetInstance() {
  dbInstance = null;
}