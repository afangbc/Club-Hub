/**
 * Small Vercel Blob adapter for public club logos.
 *
 * Keeping this behind one module prevents image bytes from entering the Redis
 * JSON document and makes it easy to swap object-storage providers later.
 */

const API_URL = "https://vercel.com/api/blob";
const API_VERSION = "12";
const PUBLIC_BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

type BlobResponse = { url?: string; error?: { message?: string } };

function token(): string {
  const value = process.env["BLOB_READ_WRITE_TOKEN"]?.trim();
  if (!value) throw new Error("Connect a public Vercel Blob store to this project first.");
  return value;
}

function storeId(value: string): string {
  return value.split("_")[3] ?? "";
}

async function blobRequest(path: string, init: RequestInit): Promise<Response> {
  const credential = token();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${credential}`,
      "x-api-version": API_VERSION,
      "x-vercel-blob-store-id": storeId(credential),
      ...init.headers,
    },
  });
}

export function isManagedLogoUrl(value: string): boolean {
  return PUBLIC_BLOB_URL.test(value);
}

export async function uploadClubLogo(input: {
  dataUrl: string;
  schoolId: string;
}): Promise<string> {
  const match = /^data:image\/(png|jpeg|webp|gif);base64,([a-z0-9+/=]+)$/i.exec(input.dataUrl);
  if (!match) throw new Error("Upload a PNG, JPEG, WebP, or GIF logo.");

  const mimeSubtype = match[1]!.toLowerCase();
  const bytes = Uint8Array.from(atob(match[2]!), (character) => character.charCodeAt(0));
  if (bytes.byteLength > 330_000) throw new Error("The club logo must be smaller than 330 KB.");

  const extension = mimeSubtype === "jpeg" ? "jpg" : mimeSubtype;
  const pathname = `club-logos/${input.schoolId}/logo-${crypto.randomUUID()}.${extension}`;
  const response = await blobRequest(`/?pathname=${encodeURIComponent(pathname)}`, {
    method: "PUT",
    body: bytes,
    headers: {
      "x-vercel-blob-access": "public",
      "x-add-random-suffix": "0",
      "x-content-type": `image/${mimeSubtype}`,
      "x-cache-control-max-age": "31536000",
    },
  });
  const result = (await response.json().catch(() => ({}))) as BlobResponse;
  if (!response.ok || !result.url)
    throw new Error(result.error?.message ?? "The logo could not be uploaded. Try again.");
  return result.url;
}

/** Best-effort cleanup: a storage outage must never roll back a valid club edit. */
export async function deleteClubLogo(url: string | undefined): Promise<void> {
  if (!url || !isManagedLogoUrl(url) || !process.env["BLOB_READ_WRITE_TOKEN"]) return;
  try {
    await blobRequest("/delete", {
      method: "POST",
      body: JSON.stringify({ urls: [url] }),
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("[clubhub] Could not remove old club logo", error);
  }
}
