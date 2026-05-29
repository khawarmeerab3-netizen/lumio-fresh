// ─── apps/web/src/lib/memory-storage.ts ──────────────────────────────────────
// All photo/video memory data lives on-device in IndexedDB.
// Zero server cost — files never leave the browser.
// Uses the `idb` library for a Promise-based IndexedDB API.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ── Schema ────────────────────────────────────────────────────────────────────

export interface DayMediaRecord {
  /** Composite key: `${challengeId}::${dayNumber}` */
  key: string;
  challengeId: string;
  dayNumber: number;
  photos: File[];
  videos: File[];
  /** ISO date string — when this was last saved */
  date: string;
}

export interface PackSettingsRecord {
  /** key = challengeId */
  challengeId: string;
  packActive: boolean;
  durationDays: number;
  purchasedAt: string | null; // ISO date string
}

interface LumioMemoryDB extends DBSchema {
  'day-media': {
    key: string; // `${challengeId}::${dayNumber}`
    value: DayMediaRecord;
    indexes: {
      'by-challenge': string; // challengeId
    };
  };
  settings: {
    key: string; // challengeId
    value: PackSettingsRecord;
  };
}

// ── DB singleton ──────────────────────────────────────────────────────────────

let _db: IDBPDatabase<LumioMemoryDB> | null = null;

async function getDB(): Promise<IDBPDatabase<LumioMemoryDB>> {
  if (_db) return _db;

  _db = await openDB<LumioMemoryDB>('lumio-memory', 1, {
    upgrade(db) {
      // day-media store with index on challengeId for getAllChallengeMedia
      const dayStore = db.createObjectStore('day-media', { keyPath: 'key' });
      dayStore.createIndex('by-challenge', 'challengeId');

      // settings store keyed by challengeId
      db.createObjectStore('settings', { keyPath: 'challengeId' });
    },
  });

  return _db;
}

// ── Key helper ────────────────────────────────────────────────────────────────

function dayKey(challengeId: string, dayNumber: number): string {
  return `${challengeId}::${dayNumber}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Save (or overwrite) photos + videos for a specific challenge day.
 * Existing media for that day is fully replaced.
 */
export async function saveDayMedia(
  challengeId: string,
  dayNumber: number,
  photos: File[],
  videos: File[]
): Promise<void> {
  const db = await getDB();
  const record: DayMediaRecord = {
    key: dayKey(challengeId, dayNumber),
    challengeId,
    dayNumber,
    photos,
    videos,
    date: new Date().toISOString(),
  };
  await db.put('day-media', record);
}

/**
 * Retrieve photos + videos for a specific challenge day.
 * Returns null if no media has been saved for that day.
 */
export async function getDayMedia(
  challengeId: string,
  dayNumber: number
): Promise<{ photos: File[]; videos: File[] } | null> {
  const db = await getDB();
  const record = await db.get('day-media', dayKey(challengeId, dayNumber));
  if (!record) return null;
  return { photos: record.photos, videos: record.videos };
}

/**
 * Retrieve all saved media days for a challenge, sorted by day number ascending.
 */
export async function getAllChallengeMedia(
  challengeId: string
): Promise<Array<{ day: number; photos: File[]; videos: File[]; date: string }>> {
  const db = await getDB();
  const records = await db.getAllFromIndex('day-media', 'by-challenge', challengeId);

  return records
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map(r => ({
      day: r.dayNumber,
      photos: r.photos,
      videos: r.videos,
      date: r.date,
    }));
}

/**
 * Delete all media for a specific challenge day.
 */
export async function deleteDayMedia(
  challengeId: string,
  dayNumber: number
): Promise<void> {
  const db = await getDB();
  await db.delete('day-media', dayKey(challengeId, dayNumber));
}

/**
 * Delete ALL media for an entire challenge (e.g. on challenge deletion).
 */
export async function clearChallenge(challengeId: string): Promise<void> {
  const db = await getDB();
  const keys = await db.getAllKeysFromIndex('day-media', 'by-challenge', challengeId);
  const tx = db.transaction('day-media', 'readwrite');
  await Promise.all([...keys.map(k => tx.store.delete(k)), tx.done]);
}

/**
 * Returns the estimated IndexedDB storage usage for this origin.
 * Falls back to estimating from all stored File sizes if StorageManager
 * is unavailable (Firefox private mode, older Safari).
 */
export async function getStorageUsage(): Promise<{ usedMb: number; limitMb: number }> {
  // Prefer the native Storage API — most accurate
  if (navigator.storage?.estimate) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return {
      usedMb: Math.round((usage / 1024 / 1024) * 10) / 10,
      limitMb: Math.round((quota / 1024 / 1024) * 10) / 10 || 2048,
    };
  }

  // Fallback: sum up sizes of all stored Files
  const db = await getDB();
  const allRecords = await db.getAll('day-media');
  let totalBytes = 0;
  for (const record of allRecords) {
    for (const f of record.photos) totalBytes += f.size;
    for (const f of record.videos) totalBytes += f.size;
  }

  return {
    usedMb: Math.round((totalBytes / 1024 / 1024) * 10) / 10,
    limitMb: 2048, // conservative 2 GB assumption
  };
}

// ── Pack settings helpers ─────────────────────────────────────────────────────

/**
 * Save (or update) memory pack settings for a challenge.
 */
export async function savePackSettings(settings: PackSettingsRecord): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

/**
 * Get memory pack settings for a challenge.
 * Returns a default inactive record if none found.
 */
export async function getPackSettings(
  challengeId: string
): Promise<PackSettingsRecord> {
  const db = await getDB();
  const record = await db.get('settings', challengeId);
  return (
    record ?? {
      challengeId,
      packActive: false,
      durationDays: 0,
      purchasedAt: null,
    }
  );
}
