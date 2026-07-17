import Link from "next/link";
import { db } from "@/lib/db";
import { deletePromotion } from "@/lib/admin/marketing-actions";
import PromotionForm from "@/components/admin/PromotionForm";

export default async function AdminPromotionsPage() {
  const [promotions, categories, collections, products] = await Promise.all([
    db.promotion.findMany({
      orderBy: [{ active: "desc" }, { priority: "desc" }],
      include: { category: true, subcategory: true, collection: true, product: true },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { subcategories: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Promotions</h1>
      </div>
      <table className="admin-table" style={{ marginBottom: 34 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Scope</th>
            <th>Discount</th>
            <th>Window</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promo) => {
            const target =
              promo.category?.name ??
              promo.subcategory?.name ??
              promo.collection?.name ??
              promo.product?.title ??
              "All products";
            return (
              <tr key={promo.id}>
                <td>
                  <Link href={`/admin/promotions/${promo.id}`} style={{ color: "var(--maroon)", fontWeight: 800 }}>
                    {promo.name}
                  </Link>
                  {promo.label ? (
                    <>
                      <br />
                      <small style={{ color: "var(--muted)" }}>{promo.label}</small>
                    </>
                  ) : null}
                </td>
                <td>
                  {promo.scope}
                  <br />
                  <small style={{ color: "var(--muted)" }}>{target}</small>
                </td>
                <td>
                  {promo.discountType === "percentage"
                    ? `${Number(promo.discountValue)}%`
                    : `₹${Number(promo.discountValue)}`}
                </td>
                <td>
                  {promo.startsAt ? promo.startsAt.toLocaleDateString("en-IN") : "—"} →{" "}
                  {promo.endsAt ? promo.endsAt.toLocaleDateString("en-IN") : "—"}
                </td>
                <td>{promo.active ? "Yes" : "No"}</td>
                <td>
                  <div className="table-actions">
                    <Link href={`/admin/promotions/${promo.id}`}>Edit</Link>
                    <form action={deletePromotion}>
                      <input type="hidden" name="id" value={promo.id} />
                      <button className="danger" type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
          {!promotions.length ? (
            <tr>
              <td colSpan={6} style={{ color: "var(--muted)" }}>
                No promotions yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Create Promotion</h1>
      </div>
      <div className="admin-card">
        <PromotionForm categories={categories} collections={collections} products={products} />
      </div>
    </>
  );
}
