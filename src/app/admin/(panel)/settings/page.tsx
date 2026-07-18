import { db } from "@/lib/db";
import { saveSettings } from "@/lib/admin/marketing-actions";

const FIELDS: { key: string; label: string; placeholder?: string; multiline?: boolean }[] = [
  { key: "site_name", label: "Site Name", placeholder: "Vaibhavi Jewels" },
  { key: "site_domain", label: "Domain", placeholder: "vaibhavijewels.in" },
  { key: "whatsapp_phone", label: "WhatsApp Number (digits only)", placeholder: "918074486906" },
  { key: "whatsapp_display", label: "WhatsApp Display", placeholder: "+91 80744 86906" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "instagram_handle", label: "Instagram Handle", placeholder: "@vaibhavijewelers" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "youtube_url", label: "YouTube URL" },
  { key: "footer_about", label: "Footer About Text" },
  { key: "shipping_flat_rate", label: "Shipping Flat Rate (₹)", placeholder: "79" },
  { key: "free_shipping_threshold", label: "Free Shipping Above (₹)", placeholder: "999" },
  {
    key: "shipping_supported_countries",
    label: "Shipping Supported Countries JSON",
    placeholder: '[{"code":"IN","label":"India"},{"code":"US","label":"United States"}]',
    multiline: true,
  },
  {
    key: "shipping_rules_json",
    label: "Shipping Rules JSON",
    placeholder:
      '[{"countryCode":"IN","minWeightGrams":0,"maxWeightGrams":500,"rate":79,"freeThreshold":999}]',
    multiline: true,
  },
];

export default async function AdminSettingsPage() {
  const rows = await db.siteSetting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <>
      <div className="admin-header">
        <h1>Settings</h1>
      </div>
      <div className="admin-card">
        <form action={saveSettings} className="admin-form">
          <label>
            Online Payments (Razorpay)
            <select name="online_payments_enabled" defaultValue={settings.online_payments_enabled ?? "true"}>
              <option value="true">Enabled - customers pay online at checkout</option>
              <option value="false">Disabled - take orders, collect payment on WhatsApp</option>
            </select>
          </label>
          <p style={{ color: "var(--muted)", fontSize: 12.5, margin: 0 }}>
            Note: online payment also stays off automatically while Razorpay keys are not configured on the server,
            regardless of this setting.
          </p>
          {FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              {field.multiline ? (
                <textarea
                  name={field.key}
                  defaultValue={settings[field.key] ?? ""}
                  placeholder={field.placeholder}
                  rows={6}
                />
              ) : (
                <input
                  name={field.key}
                  defaultValue={settings[field.key] ?? ""}
                  placeholder={field.placeholder}
                />
              )}
            </label>
          ))}
          <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
            Save Settings
          </button>
        </form>
      </div>
    </>
  );
}
