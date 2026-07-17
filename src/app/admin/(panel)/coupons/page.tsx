import Link from "next/link";
import { db } from "@/lib/db";
import { deleteCoupon } from "@/lib/admin/marketing-actions";
import CouponForm from "@/components/admin/CouponForm";

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <div className="admin-header">
        <h1>Coupons</h1>
      </div>
      <table className="admin-table" style={{ marginBottom: 34 }}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Discount</th>
            <th>Min Order</th>
            <th>Usage</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr key={coupon.id}>
              <td>
                <Link href={`/admin/coupons/${coupon.id}`} style={{ color: "var(--maroon)", fontWeight: 800 }}>
                  {coupon.code}
                </Link>
              </td>
              <td>
                {coupon.discountType === "percentage"
                  ? `${Number(coupon.discountValue)}%`
                  : `₹${Number(coupon.discountValue)}`}
              </td>
              <td>{coupon.minOrderValue ? `₹${Number(coupon.minOrderValue)}` : "—"}</td>
              <td>
                {coupon.usedCount}
                {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
              </td>
              <td>{coupon.active ? "Yes" : "No"}</td>
              <td>
                <div className="table-actions">
                  <Link href={`/admin/coupons/${coupon.id}`}>Edit</Link>
                  <form action={deleteCoupon}>
                    <input type="hidden" name="id" value={coupon.id} />
                    <button className="danger" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {!coupons.length ? (
            <tr>
              <td colSpan={6} style={{ color: "var(--muted)" }}>
                No coupons yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Create Coupon</h1>
      </div>
      <div className="admin-card">
        <CouponForm />
      </div>
    </>
  );
}
