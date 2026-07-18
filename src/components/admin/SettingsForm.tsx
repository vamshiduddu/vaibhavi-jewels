"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Field = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

type CountryRow = {
  id: string;
  code: string;
  label: string;
};

type RuleRow = {
  id: string;
  countryCode: string;
  minWeightGrams: string;
  maxWeightGrams: string;
  rate: string;
  freeThreshold: string;
};

type Props = {
  action: (formData: FormData) => void;
  settings: Record<string, string>;
  activeTab: "general" | "shipping" | "international";
  generalFields: Field[];
};

const DEFAULT_COUNTRIES: CountryRow[] = [
  { id: "country-in", code: "IN", label: "India" },
  { id: "country-us", code: "US", label: "United States" },
  { id: "country-ca", code: "CA", label: "Canada" },
  { id: "country-gb", code: "GB", label: "United Kingdom" },
  { id: "country-au", code: "AU", label: "Australia" },
  { id: "country-de", code: "DE", label: "Germany" },
  { id: "country-no", code: "NO", label: "Norway" },
  { id: "country-nz", code: "NZ", label: "New Zealand" },
];

const DEFAULT_RULES: RuleRow[] = [
  { id: "rule-in-1", countryCode: "IN", minWeightGrams: "0", maxWeightGrams: "500", rate: "79", freeThreshold: "999" },
  { id: "rule-in-2", countryCode: "IN", minWeightGrams: "501", maxWeightGrams: "1000", rate: "129", freeThreshold: "1499" },
  { id: "rule-in-3", countryCode: "IN", minWeightGrams: "1001", maxWeightGrams: "2000", rate: "199", freeThreshold: "2499" },
  { id: "rule-us-1", countryCode: "US", minWeightGrams: "0", maxWeightGrams: "500", rate: "1800", freeThreshold: "" },
  { id: "rule-us-2", countryCode: "US", minWeightGrams: "501", maxWeightGrams: "1000", rate: "3200", freeThreshold: "" },
  { id: "rule-us-3", countryCode: "US", minWeightGrams: "1001", maxWeightGrams: "2000", rate: "5200", freeThreshold: "" },
];

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseCountries(raw: string | undefined): CountryRow[] {
  if (!raw) return DEFAULT_COUNTRIES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_COUNTRIES;
    const rows = parsed
      .filter((item) => item && typeof item.code === "string" && typeof item.label === "string")
      .map((item, index) => ({
        id: `country-${index}`,
        code: String(item.code).toUpperCase().trim(),
        label: String(item.label).trim(),
      }))
      .filter((item) => item.code && item.label);
    return rows.length ? rows : DEFAULT_COUNTRIES;
  } catch {
    return DEFAULT_COUNTRIES;
  }
}

function parseRules(raw: string | undefined): RuleRow[] {
  if (!raw) return DEFAULT_RULES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_RULES;
    const rows = parsed
      .filter((item) => item && typeof item.countryCode === "string" && Number.isFinite(Number(item.rate)))
      .map((item, index) => ({
        id: `rule-${index}`,
        countryCode: String(item.countryCode).toUpperCase().trim(),
        minWeightGrams: String(item.minWeightGrams ?? 0),
        maxWeightGrams:
          item.maxWeightGrams === null || item.maxWeightGrams === undefined ? "" : String(item.maxWeightGrams),
        rate: String(item.rate ?? ""),
        freeThreshold:
          item.freeThreshold === null || item.freeThreshold === undefined ? "" : String(item.freeThreshold),
      }))
      .filter((item) => item.countryCode);
    return rows.length ? rows : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

export default function SettingsForm({ action, settings, activeTab, generalFields }: Props) {
  const [countries, setCountries] = useState<CountryRow[]>(() => parseCountries(settings.shipping_supported_countries));
  const [rules, setRules] = useState<RuleRow[]>(() => parseRules(settings.shipping_rules_json));

  const domesticRules = useMemo(() => rules.filter((rule) => rule.countryCode === "IN"), [rules]);
  const internationalRules = useMemo(() => rules.filter((rule) => rule.countryCode !== "IN"), [rules]);

  const countriesJson = JSON.stringify(
    countries
      .map((country) => ({
        code: country.code.trim().toUpperCase(),
        label: country.label.trim(),
      }))
      .filter((country) => country.code && country.label),
  );

  const rulesJson = JSON.stringify(
    rules
      .map((rule) => ({
        countryCode: rule.countryCode.trim().toUpperCase(),
        minWeightGrams: Number(rule.minWeightGrams || 0),
        maxWeightGrams: rule.maxWeightGrams === "" ? null : Number(rule.maxWeightGrams),
        rate: Number(rule.rate || 0),
        freeThreshold: rule.freeThreshold === "" ? null : Number(rule.freeThreshold),
      }))
      .filter((rule) => rule.countryCode && Number.isFinite(rule.rate)),
  );

  function updateCountry(id: string, key: "code" | "label", value: string) {
    setCountries((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function removeCountry(id: string) {
    setCountries((current) => current.filter((row) => row.id !== id));
  }

  function addCountry() {
    setCountries((current) => [...current, { id: nextId("country"), code: "", label: "" }]);
  }

  function updateRule(id: string, key: keyof Omit<RuleRow, "id">, value: string) {
    setRules((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function removeRule(id: string) {
    setRules((current) => current.filter((row) => row.id !== id));
  }

  function addRule(countryCode: string) {
    setRules((current) => [
      ...current,
      {
        id: nextId("rule"),
        countryCode,
        minWeightGrams: "0",
        maxWeightGrams: "",
        rate: "",
        freeThreshold: "",
      },
    ]);
  }

  function renderRulesTable(rows: RuleRow[], kind: "domestic" | "international") {
    return (
      <div className="settings-grid-block">
        <div className="chart-card-head">
          <h3>{kind === "domestic" ? "Domestic Weight Rules" : "International Weight Rules"}</h3>
          <span>{rows.length} slabs</span>
        </div>
        <p className="settings-help">
          {kind === "domestic"
            ? "Create India shipping slabs by parcel weight. Leave max weight blank for the final slab."
            : "Create separate weight slabs per country. Use OTHER when you want a fallback rule."}
        </p>
        <div className="settings-table-wrap">
          <table className="admin-table settings-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Min Weight (g)</th>
                <th>Max Weight (g)</th>
                <th>Rate (₹)</th>
                <th>Free Above (₹)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <input
                      value={rule.countryCode}
                      onChange={(event) => updateRule(rule.id, "countryCode", event.target.value.toUpperCase())}
                      placeholder={kind === "domestic" ? "IN" : "US / OTHER"}
                      disabled={kind === "domestic"}
                    />
                  </td>
                  <td>
                    <input
                      value={rule.minWeightGrams}
                      onChange={(event) => updateRule(rule.id, "minWeightGrams", event.target.value)}
                      inputMode="numeric"
                    />
                  </td>
                  <td>
                    <input
                      value={rule.maxWeightGrams}
                      onChange={(event) => updateRule(rule.id, "maxWeightGrams", event.target.value)}
                      inputMode="numeric"
                      placeholder="No limit"
                    />
                  </td>
                  <td>
                    <input value={rule.rate} onChange={(event) => updateRule(rule.id, "rate", event.target.value)} inputMode="decimal" />
                  </td>
                  <td>
                    <input
                      value={rule.freeThreshold}
                      onChange={(event) => updateRule(rule.id, "freeThreshold", event.target.value)}
                      inputMode="decimal"
                      placeholder={kind === "domestic" ? "999" : "Optional"}
                    />
                  </td>
                  <td>
                    <button type="button" className="secondary-button" onClick={() => removeRule(rule.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>
                    No rules yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="secondary-button"
          style={{ width: "fit-content" }}
          onClick={() => addRule(kind === "domestic" ? "IN" : "OTHER")}
        >
          Add {kind === "domestic" ? "Domestic" : "International"} Rule
        </button>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="tab-strip" style={{ marginBottom: 16 }}>
        <Link href="/admin/settings" className={activeTab === "general" ? "tab-link active" : "tab-link"}>
          General
        </Link>
        <Link href="/admin/settings?tab=shipping" className={activeTab === "shipping" ? "tab-link active" : "tab-link"}>
          Shipping
        </Link>
        <Link href="/admin/settings?tab=international" className={activeTab === "international" ? "tab-link active" : "tab-link"}>
          International Rules
        </Link>
      </div>

      <form action={action} className="admin-form settings-form" style={{ maxWidth: "none" }}>
        <input type="hidden" name="shipping_supported_countries" value={countriesJson} />
        <input type="hidden" name="shipping_rules_json" value={rulesJson} />

        {activeTab === "general" ? (
          <>
            <label>
              Online Payments (Razorpay)
              <select name="online_payments_enabled" defaultValue={settings.online_payments_enabled ?? "true"}>
                <option value="true">Enabled - customers pay online at checkout</option>
                <option value="false">Disabled - take orders, collect payment on WhatsApp</option>
              </select>
            </label>
            <p className="settings-help">
              Online payment stays off automatically while Razorpay keys are missing on the server.
            </p>
            <div className="settings-field-grid">
              {generalFields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  {field.multiline ? (
                    <textarea
                      name={field.key}
                      defaultValue={settings[field.key] ?? ""}
                      placeholder={field.placeholder}
                      rows={field.key === "footer_about" ? 5 : 3}
                    />
                  ) : (
                    <input name={field.key} defaultValue={settings[field.key] ?? ""} placeholder={field.placeholder} />
                  )}
                </label>
              ))}
            </div>
          </>
        ) : null}

        {activeTab === "shipping" ? (
          <>
            <div className="settings-field-grid">
              <label>
                Domestic Base Flat Rate (₹)
                <input name="shipping_flat_rate" defaultValue={settings.shipping_flat_rate ?? "79"} inputMode="decimal" />
              </label>
              <label>
                Domestic Free Shipping Above (₹)
                <input name="free_shipping_threshold" defaultValue={settings.free_shipping_threshold ?? "999"} inputMode="decimal" />
              </label>
            </div>
            <div className="settings-grid-block">
              <div className="chart-card-head">
                <h3>Supported Countries</h3>
                <span>{countries.length} countries</span>
              </div>
              <p className="settings-help">
                These countries appear in checkout. Add or remove countries here without touching JSON.
              </p>
              <div className="settings-table-wrap">
                <table className="admin-table settings-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Country Name</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map((country) => (
                      <tr key={country.id}>
                        <td>
                          <input
                            value={country.code}
                            onChange={(event) => updateCountry(country.id, "code", event.target.value.toUpperCase())}
                            placeholder="IN"
                          />
                        </td>
                        <td>
                          <input
                            value={country.label}
                            onChange={(event) => updateCountry(country.id, "label", event.target.value)}
                            placeholder="India"
                          />
                        </td>
                        <td>
                          <button type="button" className="secondary-button" onClick={() => removeCountry(country.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="secondary-button" style={{ width: "fit-content" }} onClick={addCountry}>
                Add Country
              </button>
            </div>
            {renderRulesTable(domesticRules, "domestic")}
          </>
        ) : null}

        {activeTab === "international" ? (
          <>
            <p className="settings-help">
              Manage non-India shipping slabs here. Use exact country codes like `US`, `CA`, `GB`, or `OTHER` for a fallback.
            </p>
            {renderRulesTable(internationalRules, "international")}
          </>
        ) : null}

        <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
          Save Settings
        </button>
      </form>
    </div>
  );
}
