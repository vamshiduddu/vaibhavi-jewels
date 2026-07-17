import { db } from "@/lib/db";
import { deleteBanner, saveBanner, saveSection } from "@/lib/admin/marketing-actions";

export default async function AdminContentPage() {
  const [banners, sections] = await Promise.all([
    db.banner.findMany({ orderBy: [{ location: "asc" }, { sortOrder: "asc" }] }),
    db.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Content</h1>
      </div>

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Banners</h1>
      </div>
      <table className="admin-table" style={{ marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Location</th>
            <th>Window</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id}>
              <td>{banner.title}</td>
              <td>{banner.location}</td>
              <td>
                {banner.startsAt ? banner.startsAt.toLocaleDateString("en-IN") : "—"} →{" "}
                {banner.endsAt ? banner.endsAt.toLocaleDateString("en-IN") : "—"}
              </td>
              <td>{banner.active ? "Yes" : "No"}</td>
              <td>
                <form action={deleteBanner}>
                  <input type="hidden" name="id" value={banner.id} />
                  <button className="danger table-actions" type="submit" style={{ background: "none", border: 0, cursor: "pointer", color: "var(--rose)", fontWeight: 800, fontSize: 13 }}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {!banners.length ? (
            <tr>
              <td colSpan={5} style={{ color: "var(--muted)" }}>
                No banners yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="admin-card" style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Add Banner</h3>
        <form action={saveBanner} className="admin-form">
          <div className="form-row-2">
            <label>
              Title
              <input name="title" required />
            </label>
            <label>
              Location
              <select name="location" defaultValue="homepage_hero">
                <option value="homepage_hero">Homepage hero</option>
                <option value="offer_strip">Offer strip</option>
                <option value="campaign">Campaign</option>
              </select>
            </label>
          </div>
          <div className="form-row-2">
            <label>
              Image URL
              <input name="imageUrl" />
            </label>
            <label>
              Link URL
              <input name="linkUrl" />
            </label>
          </div>
          <div className="form-row-2">
            <label>
              Starts At
              <input name="startsAt" type="datetime-local" />
            </label>
            <label>
              Ends At
              <input name="endsAt" type="datetime-local" />
            </label>
          </div>
          <div className="form-row-2">
            <label>
              Sort Order
              <input name="sortOrder" type="number" defaultValue={0} />
            </label>
            <label className="checkbox-label" style={{ alignSelf: "end" }}>
              <input type="checkbox" name="active" defaultChecked />
              Active
            </label>
          </div>
          <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
            Save Banner
          </button>
        </form>
      </div>

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Homepage Sections</h1>
      </div>
      <div style={{ display: "grid", gap: 24 }}>
        {sections.map((section) => (
          <div key={section.id} className="admin-card">
            <h3 style={{ marginBottom: 16 }}>{section.key}</h3>
            <form action={saveSection} className="admin-form">
              <input type="hidden" name="key" value={section.key} />
              <div className="form-row-2">
                <label>
                  Kicker
                  <input name="kicker" defaultValue={section.kicker ?? ""} />
                </label>
                <label>
                  Title
                  <input name="title" defaultValue={section.title ?? ""} />
                </label>
              </div>
              <label>
                Body
                <textarea name="body" defaultValue={section.body ?? ""} />
              </label>
              <div className="form-row-2">
                <label>
                  CTA Text
                  <input name="ctaText" defaultValue={section.ctaText ?? ""} />
                </label>
                <label>
                  CTA URL
                  <input name="ctaUrl" defaultValue={section.ctaUrl ?? ""} />
                </label>
              </div>
              <div className="form-row-2">
                <label>
                  Image URL
                  <input name="imageUrl" defaultValue={section.imageUrl ?? ""} />
                </label>
                <label>
                  Sort Order
                  <input name="sortOrder" type="number" defaultValue={section.sortOrder} />
                </label>
              </div>
              <label className="checkbox-label">
                <input type="checkbox" name="active" defaultChecked={section.active} />
                Active
              </label>
              <button className="secondary-button" type="submit" style={{ width: "fit-content" }}>
                Save Section
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
