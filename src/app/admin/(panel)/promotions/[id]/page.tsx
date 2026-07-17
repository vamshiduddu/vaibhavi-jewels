import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PromotionForm from "@/components/admin/PromotionForm";

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [promotion, categories, collections, products] = await Promise.all([
    db.promotion.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { subcategories: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!promotion) notFound();

  return (
    <>
      <div className="admin-header">
        <h1>Edit Promotion</h1>
      </div>
      <div className="admin-card">
        <PromotionForm
          promotion={promotion}
          categories={categories}
          collections={collections}
          products={products}
        />
      </div>
    </>
  );
}
