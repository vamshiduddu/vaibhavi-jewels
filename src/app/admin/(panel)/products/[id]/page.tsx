import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { subcategories: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <div className="admin-header">
        <h1>Edit Product</h1>
      </div>
      <div className="admin-card">
        <ProductForm product={product} categories={categories} collections={collections} />
      </div>
    </>
  );
}
