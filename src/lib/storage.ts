import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp, { type OverlayOptions } from "sharp";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-media";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 1800;
const OUTPUT_QUALITY = 82;

function storageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type UploadOptions = {
  folder?: string;
  watermarkText?: string | null;
};

function sanitizePathPart(input: string | null | undefined, fallback: string): string {
  const value = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");
  return value || fallback;
}

function escapeXml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildTextOverlay(width: number, height: number, watermarkText: string): Buffer {
  const fontSize = Math.max(12, Math.round(width * 0.014));
  const padX = Math.max(16, Math.round(width * 0.02));
  const padY = Math.max(10, Math.round(height * 0.015));
  const boxHeight = fontSize + padY * 2;
  const safeText = escapeXml(watermarkText);
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${padX}" y="${height - boxHeight - padY}" rx="${Math.round(fontSize * 0.45)}" ry="${Math.round(fontSize * 0.45)}"
        width="${Math.round(width * 0.2)}" height="${boxHeight}" fill="rgba(101,8,21,0.58)" />
      <text
        x="${padX + Math.round(fontSize * 0.7)}"
        y="${height - padY - Math.round(fontSize * 0.55)}"
        fill="#fffaf3"
        font-size="${fontSize}"
        font-family="Arial, sans-serif"
        font-weight="700"
      >${safeText}</text>
    </svg>
  `;
  return Buffer.from(svg);
}

async function buildLogoOverlay(width: number): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "vaibhavi-transparent.webp");
  const logoSource = await readFile(logoPath);
  const logoWidth = Math.max(120, Math.min(240, Math.round(width * 0.18)));
  return sharp(logoSource)
    .resize({ width: logoWidth, withoutEnlargement: true })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function buildFaviconOverlay(width: number): Promise<Buffer> {
  const faviconPath = path.join(process.cwd(), "public", "favicon.webp");
  const faviconSource = await readFile(faviconPath);
  const faviconWidth = Math.max(34, Math.min(68, Math.round(width * 0.055)));
  return sharp(faviconSource)
    .resize({ width: faviconWidth, withoutEnlargement: true })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function optimizeImage(
  file: File,
  options: UploadOptions,
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const input = Buffer.from(await file.arrayBuffer());
  const source = sharp(input, { failOn: "none" }).rotate();
  const resized = source.resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });
  const metadata = await resized.metadata();
  const width = metadata.width ?? 1200;
  const height = metadata.height ?? 1200;
  const overlays: OverlayOptions[] = [];
  const watermarkText = options.watermarkText?.trim();

  if (watermarkText) {
    overlays.push({
      input: buildTextOverlay(width, height, watermarkText),
      top: 0,
      left: 0,
    });
  }

  overlays.push({
    input: await buildFaviconOverlay(width),
    gravity: "northwest",
    top: Math.max(16, Math.round(height * 0.018)),
    left: Math.max(16, Math.round(width * 0.018)),
    blend: "over",
  });

  overlays.push({
    input: await buildLogoOverlay(width),
    gravity: "southeast",
    top: Math.max(18, Math.round(height * 0.02)),
    left: Math.max(18, Math.round(width * 0.02)),
    blend: "over",
  });

  const buffer = await resized
    .composite(overlays)
    .webp({ quality: OUTPUT_QUALITY, effort: 5 })
    .toBuffer();

  return {
    buffer,
    contentType: "image/webp",
    extension: "webp",
  };
}

export async function uploadProductImage(
  file: File,
  options: UploadOptions = {},
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
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image is too large (max 8 MB)." };
  }

  // create the public bucket on first use; ignore "already exists"
  await supabase.storage
    .createBucket(BUCKET, { public: true, fileSizeLimit: "8MB" })
    .catch(() => undefined);

  const optimized = await optimizeImage(file, options);
  const folder = sanitizePathPart(options.folder, "products");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${optimized.extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, optimized.buffer, {
    contentType: optimized.contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    return { ok: false, error: `Upload failed: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
