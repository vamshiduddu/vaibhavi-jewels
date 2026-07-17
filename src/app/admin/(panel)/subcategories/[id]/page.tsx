import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import SubcategoryForm from "@/components/admin/SubcategoryForm";

export default async function EditSubcategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [subcategory, categories] = await Promise.all([
    db.subcategory.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!subcategory) notFound();

  return (
    <>
      <div className="admin-header">
        <h1>Edit Subcategory</h1>
      </div>
      <div className="admin-card">
        <SubcategoryForm subcategory={subcategory} categories={categories} />
      </div>
    </>
  );
}
