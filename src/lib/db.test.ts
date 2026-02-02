// src/lib/db.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initDb, addNote, getNotes, _resetInstance } from './db';

// 1. Mock the Tauri SQL plugin
const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn().mockImplementation(() => Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      })),
    },
  };
});

describe('Database Service (db.ts)', () => {

  // Reset mocks before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks();
    _resetInstance(); // Clear the singleton
  });

  describe('initDb', () => {
    it('should create the table if it does not exist', async () => {
      await initDb();

      expect(mockExecute).toHaveBeenCalledTimes(1);
      // Check if the SQL string contains the "CREATE TABLE" command
      expect(mockExecute.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS notes');
    });
  });

  describe('addNote', () => {
    it('should insert data with correct parameters', async () => {
      const testContent = 'Meeting with client';
      await addNote(testContent);

      expect(mockExecute).toHaveBeenCalledTimes(1); // 1 call to getDb (loads), 1 to execute? No, load is cached.
      // Verify we passed the content safely as a parameter
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notes'),
        [testContent]
      );
    });

    it('should ignore empty strings for efficiency', async () => {
      await addNote('   '); // Empty string with spaces
      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('getNotes', () => {
    it('should fetch notes with a default limit', async () => {
      // Setup the mock to return dummy data
      const mockData = [{ id: 1, content: 'Test', created_at: '2023-01-01' }];
      mockSelect.mockResolvedValue(mockData);

      const result = await getNotes();

      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM'),
        [50] // Default limit
      );
      expect(result).toEqual(mockData);
    });

    it('should respect custom limits', async () => {
      await getNotes(10);
      expect(mockSelect).toHaveBeenCalledWith(expect.any(String), [10]);
    });
  });
});