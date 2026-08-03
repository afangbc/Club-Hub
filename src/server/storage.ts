/**
 * Storage for the single-document ClubHub database.
 *
 * Production uses Upstash Redis; local development uses a file. Everything
 * funnels through this interface so the application and authorization layers
 * stay storage-agnostic.
 */

export type StorageDriver = {
  readonly kind: string;
  read(): Promise<string | null>;
  write(contents: string): Promise<void>;
};

const DATA_FILE =
  (typeof process === "undefined" ? undefined : process.env["CLUBHUB_DATA_FILE"]) ??
  ".data/clubhub.json";

const REDIS_KEY =
  (typeof process === "undefined" ? undefined : process.env["CLUBHUB_REDIS_KEY"]) ??
  "clubhub:database:v1";

type RedisResponse = { result?: unknown; error?: string };

/**
 * Upstash exposes Redis over HTTPS, which works in Vercel Functions without a
 * long-lived TCP connection. The Vercel integration supplies these variables.
 */
async function createRedisDriver(): Promise<StorageDriver | null> {
  if (typeof process === "undefined") return null;

  const url = process.env["UPSTASH_REDIS_REST_URL"]?.replace(/\/$/, "");
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (!url && !token) return null;
  if (!url || !token) {
    throw new Error(
      "[clubhub] Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.",
    );
  }

  const command = async (parts: string[]): Promise<unknown> => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(parts),
    });

    let payload: RedisResponse;
    try {
      payload = (await response.json()) as RedisResponse;
    } catch {
      throw new Error(`[clubhub] Redis returned an unreadable response (${response.status}).`);
    }

    if (!response.ok || payload.error) {
      throw new Error(
        `[clubhub] Redis request failed (${response.status}): ${payload.error ?? "unknown error"}`,
      );
    }
    return payload.result;
  };

  return {
    kind: `Upstash Redis (${REDIS_KEY})`,
    async read() {
      const result = await command(["GET", REDIS_KEY]);
      if (result === null || result === undefined) return null;
      if (typeof result !== "string") {
        throw new Error("[clubhub] Redis returned a non-string database value.");
      }
      return result;
    },
    async write(contents: string) {
      await command(["SET", REDIS_KEY, contents]);
    },
  };
}

/** Avoid statically bundling Node filesystem modules for non-Node targets. */
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
    driverPromise = createRedisDriver().then(async (redis) => {
      if (redis) return redis;

      if (typeof process !== "undefined" && process.env["VERCEL"]) {
        throw new Error(
          "[clubhub] Vercel requires persistent storage. Connect Upstash Redis and redeploy.",
        );
      }

      const file = await createFileDriver();
      if (file) return file;

      console.warn(
        "[clubhub] No persistent storage available; using memory. Data will not survive a restart.",
      );
      return createMemoryDriver();
    });
  }
  return driverPromise;
}
