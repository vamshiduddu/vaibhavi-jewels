import type { Collection } from "@prisma/client";
import { saveCollection } from "@/lib/admin/catalog-actions";

export default function CollectionForm({ collection }: { collection?: Collection | null }) {
  return (
    <form action={saveCollection} className="admin-form">
      {collection ? <input type="hidden" name="id" value={collection.id} /> : null}
      <div className="form-row-2">
        <label>
          Name
          <input name="name" required defaultValue={collection?.name ?? ""} />
        </label>
        <label>
          Slug (blank = auto)
          <input name="slug" defaultValue={collection?.slug ?? ""} />
        </label>
      </div>
      <label>
        Description
        <textarea name="description" defaultValue={collection?.description ?? ""} />
      </label>
      <div className="form-row-2">
        <label>
          Image URL
          <input name="image" defaultValue={collection?.image ?? ""} />
        </label>
        <label>
          Sort Order
          <input name="sortOrder" type="number" defaultValue={collection?.sortOrder ?? 0} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          SEO Title
          <input name="seoTitle" defaultValue={collection?.seoTitle ?? ""} />
        </label>
        <label>
          SEO Description
          <input name="seoDescription" defaultValue={collection?.seoDescription ?? ""} />
        </label>
      </div>
      <label className="checkbox-label">
        <input type="checkbox" name="active" defaultChecked={collection?.active ?? true} />
        Active
      </label>
      <label className="checkbox-label">
        <input type="checkbox" name="featured" defaultChecked={collection?.featured ?? false} />
        Featured
      </label>
      <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
        Save Collection
      </button>
    </form>
  );
}
