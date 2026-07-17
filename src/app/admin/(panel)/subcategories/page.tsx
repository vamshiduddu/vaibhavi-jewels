import Link from "next/link";
import { db } from "@/lib/db";
import { deleteSubcategory } from "@/lib/admin/catalog-actions";
import SubcategoryForm from "@/components/admin/SubcategoryForm";

export default async function AdminSubcategoriesPage() {
  const [subcategories, categories] = await Promise.all([
    db.subcategory.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { category: true, _count: { select: { products: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Subcategories</h1>
      </div>
      <table className="admin-table" style={{ marginBottom: 34 }}>
        <thead>
          <tr>
            <th>Category</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {subcategories.map((sub) => (
            <tr key={sub.id}>
              <td>{sub.category.name}</td>
              <td>{sub.name}</td>
              <td>/{sub.slug}</td>
              <td>{sub._count.products}</td>
              <td>{sub.active ? "Yes" : "No"}</td>
              <td>
                <div className="table-actions">
                  <Link href={`/admin/subcategories/${sub.id}`}>Edit</Link>
                  <form action={deleteSubcategory}>
                    <input type="hidden" name="id" value={sub.id} />
                    <button className="danger" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {!subcategories.length ? (
            <tr>
              <td colSpan={6} style={{ color: "var(--muted)" }}>
                No subcategories yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Add Subcategory</h1>
      </div>
      <div className="admin-card">
        <SubcategoryForm categories={categories} />
      </div>
    </>
  );
}
