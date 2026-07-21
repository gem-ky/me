import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.join(__dirname, 'data.json');

// Структура базы:
// users: [{ id, username, email, passwordHash, createdAt }]
// lists: [{ userId, animeId, status, score, episodesWatched, updatedAt }]
const defaultData = { users: [], lists: [] };

export const db = await JSONFilePreset(dbFile, defaultData);

export function findUserByEmail(email) {
  return db.data.users.find((u) => u.email === email);
}

export function findUserById(id) {
  return db.data.users.find((u) => u.id === id);
}

export async function createUser(user) {
  db.data.users.push(user);
  await db.write();
  return user;
}

export async function upsertListEntry(entry) {
  const idx = db.data.lists.findIndex(
    (l) => l.userId === entry.userId && l.animeId === entry.animeId
  );
  if (idx >= 0) {
    db.data.lists[idx] = { ...db.data.lists[idx], ...entry, updatedAt: Date.now() };
  } else {
    db.data.lists.push({ ...entry, updatedAt: Date.now() });
  }
  await db.write();
}

export function getUserList(userId) {
  return db.data.lists.filter((l) => l.userId === userId);
}

export async function removeListEntry(userId, animeId) {
  db.data.lists = db.data.lists.filter(
    (l) => !(l.userId === userId && l.animeId === animeId)
  );
  await db.write();
}
