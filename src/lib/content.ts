import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";

const getSettingsCached = unstable_cache(
  async () => {
    const rows = await db.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
  },
  ["settings:all"],
  { revalidate: 300, tags: [CACHE_TAGS.settings] },
);

const getSectionsCached = unstable_cache(
  async () => {
    const rows = await db.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
    return Object.fromEntries(rows.map((r) => [r.key, r])) as Record<string, (typeof rows)[number]>;
  },
  ["sections:all"],
  { revalidate: 300, tags: [CACHE_TAGS.sections] },
);

export async function getSettings(): Promise<Record<string, string>> {
  return getSettingsCached();
}

export async function getSection(key: string) {
  const sections = await getSectionsCached();
  const section = sections[key];
  return section?.active ? section : null;
}

export async function getSections() {
  return getSectionsCached();
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export async function onlinePaymentsEnabled(): Promise<boolean> {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return false;
  const settings = await getSettingsCached();
  return (settings.online_payments_enabled ?? "true") === "true";
}
