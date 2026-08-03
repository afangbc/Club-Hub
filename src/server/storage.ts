/**
 * Where the database file lives.
 *
 * The whole database is one JSON document, which is the right shape at campus
 * scale and keeps the deployment dependency-free. Everything funnels through
 * this driver interface, so moving to Postgres or SQLite later means writing one
 * more driver rather than touching any application code.
 */

export type StorageDriver = {
  readonly kind: string;
  read(): Promise<string | null>;
  write(contents: string): Promise<void>;
};

const DATA_FILE =
  (typeof process === "undefined" ? undefined : process.env["CLUBHUB_DATA_FILE"]) ??
  ".data/clubhub.json";

/**
 * Built with a computed specifier so bundlers targeting a runtime without a
 * filesystem don't try to resolve `node:fs` at build time.
 */
async function createFileDriver(): Promise<StorageDriver | null> {
  try {
    const fs = await import(/* @vite-ignore */ "node:" + "fs/promises");
    const path = await import(/* @vite-ignore */ "node:" + "path");
    const file = path.resolve(process.cwd(), DATA_FILE);
    const dir = path.dirname(file);

    return {
      kind: `file (${DATA_FILE})`,
      async read() {
        try {
          return await fs.readFile(file, "utf8");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
          throw error;
        }
      },
      async write(contents: string) {
        await fs.mkdir(dir, { recursive: true });
        // Write-then-rename so a crash mid-write can't truncate the database.
        const temp = `${file}.${process.pid}.tmp`;
        await fs.writeFile(temp, contents, "utf8");
        await fs.rename(temp, file);
      },
    };
  } catch {
    return null;
  }
}

function createMemoryDriver(): StorageDriver {
  let contents: string | null = null;
  return {
    kind: "memory (not durable)",
    read: async () => contents,
    write: async (next: string) => {
      contents = next;
    },
  };
}

let driverPromise: Promise<StorageDriver> | null = null;

export function getStorageDriver(): Promise<StorageDriver> {
  if (!driverPromise) {
    driverPromise = createFileDriver().then((driver) => {
      if (driver) return driver;
      console.warn(
        "[clubhub] No filesystem available — falling back to in-memory storage. Data will not survive a restart.",
      );
      return createMemoryDriver();
    });
  }
  return driverPromise;
}
