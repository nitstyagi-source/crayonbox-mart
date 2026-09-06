import fs from 'fs';
import path from 'path';
import { queryMart } from './db';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

export function readData<T>(fileName: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  try {
    if (!fs.existsSync(filePath)) {
      writeData(fileName, defaultValue);
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err);
    return defaultValue;
  }
}

export function writeData<T>(fileName: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`Could not write to local filesystem ${fileName} (normal in serverless/Vercel):`, err);
  }
}

// Database-Backed Persistence for Vercel Serverless
export async function readDataAsync<T>(fileName: string, defaultValue: T): Promise<T> {
  try {
    const res = await queryMart(
      'SELECT value FROM mart.store_kv WHERE key = $1 LIMIT 1;',
      [fileName]
    );
    if (res.rows && res.rows.length > 0 && res.rows[0].value !== null) {
      return res.rows[0].value as T;
    }
  } catch (dbErr) {
    console.warn(`[Mart DB Read Error for ${fileName}]:`, dbErr);
  }

  // Fallback to local file
  return readData(fileName, defaultValue);
}

export async function writeDataAsync<T>(fileName: string, data: T): Promise<void> {
  // 1. Persist to Postgres database
  try {
    await queryMart(`
      INSERT INTO mart.store_kv (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    `, [fileName, JSON.stringify(data)]);
  } catch (dbErr) {
    console.error(`[Mart DB Write Error for ${fileName}]:`, dbErr);
  }

  // 2. Also try writing local copy
  writeData(fileName, data);
}
