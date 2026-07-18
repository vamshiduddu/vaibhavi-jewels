import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function EditSubcategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subcategory = await db.subcategory.findUnique({
    where: { id },
    select: { categoryId: true },
  });
  if (!subcategory) {
    redirect("/admin/categories");
  }
  redirect(`/admin/categories?categoryId=${subcategory.categoryId}&editSubcategoryId=${id}`);
}
