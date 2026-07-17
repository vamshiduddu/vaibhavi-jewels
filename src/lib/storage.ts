import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-media";

function storageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function uploadProductImage(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = storageClient();
  if (!supabase) {
    return {
      ok: false,
      error:
        "Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.",
    };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Only image files can be uploaded." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Image is too large (max 8 MB)." };
  }

  // create the public bucket on first use; ignore "already exists"
  await supabase.storage
    .createBucket(BUCKET, { public: true, fileSizeLimit: "8MB" })
    .catch(() => undefined);

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    return { ok: false, error: `Upload failed: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
