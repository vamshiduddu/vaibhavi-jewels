import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { archiveProduct } from "@/lib/admin/catalog-actions";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
      collection: true,
      images: { where: { kind: "image" }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Products</h1>
        <Link className="primary-button" href="/admin/products/new">
          Add Product
        </Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Title</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0].url} alt="" />
                ) : null}
              </td>
              <td>
                <Link href={`/admin/products/${product.id}`} style={{ color: "var(--maroon)", fontWeight: 800 }}>
                  {product.title}
                </Link>
                <br />
                <small style={{ color: "var(--muted)" }}>/{product.slug}</small>
              </td>
              <td>
                {product.category?.name ?? "—"}
                {product.collection ? (
                  <>
                    <br />
                    <small style={{ color: "var(--muted)" }}>{product.collection.name}</small>
                  </>
                ) : null}
              </td>
              <td>{formatINR(product.price)}</td>
              <td>{product.stockQuantity}</td>
              <td>
                <span className="pill">{product.status}</span>
              </td>
              <td>
                <div className="table-actions">
                  <Link href={`/admin/products/${product.id}`}>Edit</Link>
                  {product.status !== "archived" ? (
                    <form action={archiveProduct}>
                      <input type="hidden" name="id" value={product.id} />
                      <button className="danger" type="submit">
                        Archive
                      </button>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {!products.length ? (
            <tr>
              <td colSpan={7} style={{ color: "var(--muted)" }}>
                No products yet. Add your first product.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
