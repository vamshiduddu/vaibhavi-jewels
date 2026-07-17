import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CollectionForm from "@/components/admin/CollectionForm";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await db.collection.findUnique({ where: { id } });
  if (!collection) notFound();

  return (
    <>
      <div className="admin-header">
        <h1>Edit Collection</h1>
      </div>
      <div className="admin-card">
        <CollectionForm collection={collection} />
      </div>
    </>
  );
}
