import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <>
      <div className="admin-header">
        <h1>Edit Category</h1>
      </div>
      <div className="admin-card">
        <CategoryForm category={category} />
      </div>
    </>
  );
}
