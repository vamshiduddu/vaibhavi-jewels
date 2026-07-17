import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { subcategories: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Add Product</h1>
      </div>
      <div className="admin-card">
        <ProductForm categories={categories} collections={collections} />
      </div>
    </>
  );
}
