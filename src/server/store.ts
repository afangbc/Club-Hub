import { buildSeedDatabase, DB_VERSION, type Database } from "./schema";
import { getStorageDriver } from "./storage";

let ready: Promise<Database> | null = null;
/** Writes are chained so two concurrent requests can't clobber each other. */
let writeChain: Promise<unknown> = Promise.resolve();

async function load(): Promise<Database> {
  const driver = await getStorageDriver();
  const raw = await driver.read();

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Database & { school?: Database["schools"][number] };
      if (parsed.version === DB_VERSION) return parsed;
      if (parsed.version === 1 && parsed.school) {
        const migrated: Database = {
          ...parsed,
          version: DB_VERSION,
          schools: [parsed.school],
          schoolVerifications: [],
        };
        delete (migrated as Database & { school?: unknown }).school;
        await driver.write(JSON.stringify(migrated, null, 2));
        console.info("[clubhub] Migrated database from version 1 to version 2.");
        return migrated;
      }
      console.warn(
        `[clubhub] Database is version ${parsed.version}, expected ${DB_VERSION}. Reseeding.`,
      );
    } catch {
      console.warn("[clubhub] Database file is unreadable. Reseeding.");
    }
  }

  const seeded = await buildSeedDatabase();
  await driver.write(JSON.stringify(seeded, null, 2));
  console.info(`[clubhub] Seeded a new database via ${driver.kind}.`);
  return seeded;
}

export function getDatabase(): Promise<Database> {
  if (!ready) {
    ready = load().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function persist(db: Database): Promise<void> {
  const driver = await getStorageDriver();
  await driver.write(JSON.stringify(db, null, 2));
}

/**
 * Read-modify-write against the database. The callback mutates the object in
 * place; the result is flushed to storage once it returns. If it throws, the
 * cache is dropped so the next read reloads the last durable state rather than
 * keeping a half-applied change in memory.
 */
export function transaction<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const db = await getDatabase();
    let result: T;
    try {
      result = await mutate(db);
    } catch (error) {
      ready = null;
      throw error;
    }
    await persist(db);
    return result;
  };

  const next = writeChain.then(run, run);
  writeChain = next.catch(() => undefined);
  return next;
}

export async function query<T>(read: (db: Database) => T): Promise<T> {
  return read(await getDatabase());
}
