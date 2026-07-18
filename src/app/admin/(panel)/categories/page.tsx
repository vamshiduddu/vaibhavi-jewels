import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCategory, deleteSubcategory } from "@/lib/admin/catalog-actions";
import CategoryForm from "@/components/admin/CategoryForm";
import SubcategoryForm from "@/components/admin/SubcategoryForm";

type Props = {
  searchParams: Promise<{
    categoryId?: string;
    editCategoryId?: string;
    editSubcategoryId?: string;
    mode?: string;
  }>;
};

export default async function AdminCategoriesPage({ searchParams }: Props) {
  const { categoryId, editCategoryId, editSubcategoryId, mode } = await searchParams;

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true, subcategories: true } },
      subcategories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      },
    },
  });

  const explicitEditCategory =
    categories.find((category) => category.id === editCategoryId) ?? null;

  const editSubcategory =
    categories
      .flatMap((category) => category.subcategories)
      .find((subcategory) => subcategory.id === editSubcategoryId) ?? null;

  const selectedCategory =
    categories.find((category) => category.id === categoryId) ??
    (editSubcategory
      ? categories.find((category) => category.id === editSubcategory.categoryId) ?? null
      : explicitEditCategory) ??
    categories[0] ??
    null;

  const isCreateMode = mode === "new";
  const formCategory = isCreateMode ? null : explicitEditCategory ?? selectedCategory;

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Categories</h1>
          <p className="admin-header-note">
            Manage categories and their subcategories from one place. Pick a category first, then create or edit its subcategories below.
          </p>
        </div>
      </div>

      <div className="admin-two-col" style={{ alignItems: "start" }}>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Category Tree</h3>
            <Link href="/admin/categories?mode=new">New Category</Link>
          </div>
          {categories.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {categories.map((category) => {
                const isSelected = selectedCategory?.id === category.id;
                const categoryHref = `/admin/categories?categoryId=${category.id}`;
                return (
                  <article
                    key={category.id}
                    className="admin-card"
                    style={{
                      padding: 14,
                      borderColor: isSelected ? "rgba(180,122,29,0.45)" : undefined,
                      boxShadow: isSelected ? "0 0 0 2px rgba(180,122,29,0.14)" : undefined,
                    }}
                  >
                    <Link
                      href={categoryHref}
                      style={{
                        display: "block",
                        margin: -14,
                        padding: 14,
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div style={{ color: "var(--maroon)", fontWeight: 700 }}>
                            {category.name}
                          </div>
                          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                            /{category.slug} · {category._count.products} products · {category._count.subcategories} subcategories
                          </div>
                        </div>
                        <span className="pill">{category.active ? "Active" : "Hidden"}</span>
                      </div>

                      {category.subcategories.length ? (
                        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                          {category.subcategories.map((subcategory) => (
                            <div
                              key={subcategory.id}
                              style={{
                                padding: "8px 10px",
                                background: "rgba(246,234,220,0.45)",
                                borderRadius: 8,
                              }}
                            >
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{subcategory.name}</div>
                              <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 2 }}>
                                /{subcategory.slug} · {subcategory._count.products} products
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="chart-empty" style={{ marginTop: 12 }}>
                          No subcategories yet.
                        </p>
                      )}
                    </Link>

                    <div className="table-actions" style={{ marginTop: 12 }}>
                      <Link href={`/admin/categories?categoryId=${category.id}&editCategoryId=${category.id}`}>
                        Edit Category
                      </Link>
                      <Link href={`/admin/categories?categoryId=${category.id}`}>
                        Manage Subcategories
                      </Link>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="redirectTo" value="/admin/categories" />
                        <button className="danger" type="submit">
                          Delete
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="chart-empty">No categories yet. Create your first category below.</p>
          )}
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div className="chart-card">
            <div className="chart-card-head">
              <h3>{formCategory ? "Edit Category" : "Create Category"}</h3>
              {formCategory ? <Link href="/admin/categories?mode=new">New Category</Link> : <span>Category master</span>}
            </div>
            <CategoryForm
              key={formCategory?.id ?? "new-category"}
              category={formCategory}
              redirectTo={formCategory?.id ? `/admin/categories?categoryId=${formCategory.id}` : "/admin/categories"}
              submitLabel={formCategory ? "Update Category" : "Create Category"}
            />
          </div>

          <div className="chart-card">
            <div className="chart-card-head">
              <h3>
                {editSubcategory
                  ? `Edit Subcategory${selectedCategory ? ` in ${selectedCategory.name}` : ""}`
                  : selectedCategory
                    ? `Subcategories for ${selectedCategory.name}`
                    : "Create Subcategory"}
              </h3>
              {editSubcategory ? (
                <Link href={selectedCategory ? `/admin/categories?categoryId=${selectedCategory.id}` : "/admin/categories"}>
                  Cancel
                </Link>
              ) : selectedCategory ? (
                <span>{selectedCategory._count.subcategories} linked</span>
              ) : (
                <span>Select a category first</span>
              )}
            </div>

            {selectedCategory ? (
              <>
                {selectedCategory.subcategories.length ? (
                  <table className="admin-table" style={{ marginBottom: 18 }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Products</th>
                        <th>Active</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCategory.subcategories.map((subcategory) => (
                        <tr key={subcategory.id}>
                          <td>{subcategory.name}</td>
                          <td>/{subcategory.slug}</td>
                          <td>{subcategory._count.products}</td>
                          <td>{subcategory.active ? "Yes" : "No"}</td>
                          <td>
                            <div className="table-actions">
                              <Link
                                href={`/admin/categories?categoryId=${selectedCategory.id}&editSubcategoryId=${subcategory.id}`}
                              >
                                Edit
                              </Link>
                              <form action={deleteSubcategory}>
                                <input type="hidden" name="id" value={subcategory.id} />
                                <input
                                  type="hidden"
                                  name="redirectTo"
                                  value={`/admin/categories?categoryId=${selectedCategory.id}`}
                                />
                                <button className="danger" type="submit">
                                  Delete
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="chart-empty" style={{ marginBottom: 18 }}>
                    No subcategories under {selectedCategory.name} yet.
                  </p>
                )}

                <SubcategoryForm
                  subcategory={editSubcategory}
                  categories={categories}
                  defaultCategoryId={selectedCategory.id}
                  redirectTo={`/admin/categories?categoryId=${selectedCategory.id}`}
                  submitLabel={editSubcategory ? "Update Subcategory" : "Create Subcategory"}
                />
              </>
            ) : (
              <p className="chart-empty">Create a category first, then its subcategories will cascade under it here.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
