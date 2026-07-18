import type { Category } from "@prisma/client";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { saveCategory } from "@/lib/admin/catalog-actions";

export default function CategoryForm({
  category,
  redirectTo = "/admin/categories",
  submitLabel = "Save Category",
}: {
  category?: Category | null;
  redirectTo?: string;
  submitLabel?: string;
}) {
  return (
    <form action={saveCategory} className="admin-form">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <input type="hidden" name="redirectTo" value={redirectTo} />
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
      <ImageUploadField
        name="image"
        initialUrl={category?.image ?? null}
        label="Category Banner"
        helpText="Upload the category banner image used for admin and storefront sections."
        uploadContext={{
          folder: category?.id ? `categories/${category.id}` : "categories/draft",
          entityType: "category",
          entityId: category?.id ?? null,
          entityLabel: null,
        }}
      />
      <label>
        Sort Order
        <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
      </label>
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
        {submitLabel}
      </button>
    </form>
  );
}
