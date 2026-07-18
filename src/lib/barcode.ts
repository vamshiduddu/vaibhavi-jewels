import "server-only";
import bwipjs from "bwip-js";

export function normalizeBarcodeValue(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9\-./$+% ]/g, "")
    .trim();
}

export function generateProductBarcodeValue(seed: { sku?: string | null; id?: string; title?: string }) {
  const raw =
    seed.sku?.trim() ||
    seed.id?.replace(/[^a-z0-9]/gi, "").slice(-10).toUpperCase() ||
    seed.title?.replace(/[^a-z0-9]/gi, "").slice(0, 10).toUpperCase() ||
    `VJ${Date.now().toString(36).toUpperCase()}`;
  return normalizeBarcodeValue(raw);
}

export async function renderBarcodeSvg(
  value: string,
  type: "code39" | "code128" | "qr" = "code39",
): Promise<string> {
  const bcid = type === "qr" ? "qrcode" : type === "code128" ? "code128" : "code39";
  const svg = await bwipjs.toSVG({
    bcid,
    text: value,
    scale: type === "qr" ? 4 : 2,
    height: type === "qr" ? undefined : 12,
    includetext: true,
    textxalign: "center",
    backgroundcolor: "FFFFFF",
  });
  return svg;
}
