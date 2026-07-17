import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCategory } from "@/lib/admin/catalog-actions";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true, subcategories: true } } },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Categories</h1>
      </div>
      <table className="admin-table" style={{ marginBottom: 34 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Products</th>
            <th>Subcategories</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>/{category.slug}</td>
              <td>{category._count.products}</td>
              <td>{category._count.subcategories}</td>
              <td>{category.active ? "Yes" : "No"}</td>
              <td>
                <div className="table-actions">
                  <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
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

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Add Category</h1>
      </div>
      <div className="admin-card">
        <CategoryForm />
      </div>
    </>
  );
}
