import type { Category, Subcategory } from "@prisma/client";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { saveSubcategory } from "@/lib/admin/catalog-actions";

export default function SubcategoryForm({
  subcategory,
  categories,
  defaultCategoryId,
  redirectTo = "/admin/categories",
  submitLabel = "Save Subcategory",
}: {
  subcategory?: Subcategory | null;
  categories: Category[];
  defaultCategoryId?: string | null;
  redirectTo?: string;
  submitLabel?: string;
}) {
  return (
    <form action={saveSubcategory} className="admin-form">
      {subcategory ? <input type="hidden" name="id" value={subcategory.id} /> : null}
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="form-row-2">
        <label>
          Parent Category
          <select name="categoryId" required defaultValue={subcategory?.categoryId ?? defaultCategoryId ?? ""}>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input name="name" required defaultValue={subcategory?.name ?? ""} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Slug (blank = auto)
          <input name="slug" defaultValue={subcategory?.slug ?? ""} />
        </label>
        <label>
          Sort Order
          <input name="sortOrder" type="number" defaultValue={subcategory?.sortOrder ?? 0} />
        </label>
      </div>
      <ImageUploadField
        name="image"
        initialUrl={subcategory?.image ?? null}
        label="Subcategory Banner"
        helpText="Upload the banner image for this subcategory."
        uploadContext={{
          folder: subcategory?.id ? `subcategories/${subcategory.id}` : "subcategories/draft",
          entityType: "subcategory",
          entityId: subcategory?.id ?? null,
          entityLabel: null,
        }}
      />
      <label>
        Description
        <textarea name="description" defaultValue={subcategory?.description ?? ""} />
      </label>
      <label className="checkbox-label">
        <input type="checkbox" name="active" defaultChecked={subcategory?.active ?? true} />
        Active
      </label>
      <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
        {submitLabel}
      </button>
    </form>
  );
}
