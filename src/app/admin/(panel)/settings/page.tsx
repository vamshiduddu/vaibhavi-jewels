import SettingsForm from "@/components/admin/SettingsForm";
import { saveSettings } from "@/lib/admin/marketing-actions";
import { db } from "@/lib/db";

const GENERAL_FIELDS: { key: string; label: string; placeholder?: string; multiline?: boolean }[] = [
  { key: "site_name", label: "Site Name", placeholder: "Vaibhavi Jewels" },
  { key: "site_domain", label: "Domain", placeholder: "vaibhavijewels.in" },
  { key: "whatsapp_phone", label: "WhatsApp Number (digits only)", placeholder: "918074486906" },
  { key: "whatsapp_display", label: "WhatsApp Display", placeholder: "+91 80744 86906" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "instagram_handle", label: "Instagram Handle", placeholder: "@vaibhavijewelers" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "youtube_url", label: "YouTube URL" },
  { key: "footer_about", label: "Footer About Text", multiline: true },
  { key: "return_to_name", label: "Return To Name", placeholder: "Vaibhavi Jewels" },
  { key: "return_to_phone", label: "Return To Phone", placeholder: "+91 80744 86906" },
  { key: "return_to_line1", label: "Return To Address Line 1" },
  { key: "return_to_line2", label: "Return To Address Line 2" },
  { key: "return_to_city", label: "Return To City" },
  { key: "return_to_state", label: "Return To State" },
  { key: "return_to_pincode", label: "Return To Pincode" },
  { key: "return_to_country", label: "Return To Country", placeholder: "India" },
];

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "shipping" || tab === "international" ? tab : "general";
  const rows = await db.siteSetting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <>
      <div className="admin-header">
        <h1>Settings</h1>
      </div>
      <SettingsForm action={saveSettings} settings={settings} activeTab={activeTab} generalFields={GENERAL_FIELDS} />
    </>
  );
}
