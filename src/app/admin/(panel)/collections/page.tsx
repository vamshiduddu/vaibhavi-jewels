import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCollection } from "@/lib/admin/catalog-actions";
import CollectionForm from "@/components/admin/CollectionForm";

export default async function AdminCollectionsPage() {
  const collections = await db.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Collections</h1>
      </div>
      <table className="admin-table" style={{ marginBottom: 34 }}>
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
          {collections.map((collection) => (
            <tr key={collection.id}>
              <td>{collection.name}</td>
              <td>/{collection.slug}</td>
              <td>{collection._count.products}</td>
              <td>{collection.active ? "Yes" : "No"}</td>
              <td>
                <div className="table-actions">
                  <Link href={`/admin/collections/${collection.id}`}>Edit</Link>
                  <form action={deleteCollection}>
                    <input type="hidden" name="id" value={collection.id} />
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
        <h1 style={{ fontSize: 28 }}>Add Collection</h1>
      </div>
      <div className="admin-card">
        <CollectionForm />
      </div>
    </>
  );
}
