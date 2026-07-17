import type { Category } from "@prisma/client";
import { saveCategory } from "@/lib/admin/catalog-actions";

export default function CategoryForm({ category }: { category?: Category | null }) {
  return (
    <form action={saveCategory} className="admin-form">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="form-row-2">
        <label>
          Name
          <input name="name" required defaultValue={category?.name ?? ""} />
        </label>
        <label>
          Slug (blank = auto)
          <input name="slug" defaultValue={category?.slug ?? ""} />
        </label>
      </div>
      <label>
        Description
        <textarea name="description" defaultValue={category?.description ?? ""} />
      </label>
      <div className="form-row-2">
        <label>
          Image URL
          <input name="image" defaultValue={category?.image ?? ""} />
        </label>
        <label>
          Sort Order
          <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          SEO Title
          <input name="seoTitle" defaultValue={category?.seoTitle ?? ""} />
        </label>
        <label>
          SEO Description
          <input name="seoDescription" defaultValue={category?.seoDescription ?? ""} />
        </label>
      </div>
      <label className="checkbox-label">
        <input type="checkbox" name="active" defaultChecked={category?.active ?? true} />
        Active
      </label>
      <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
        Save Category
      </button>
    </form>
  );
}
