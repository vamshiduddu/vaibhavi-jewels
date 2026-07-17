import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CouponForm from "@/components/admin/CouponForm";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <>
      <div className="admin-header">
        <h1>Edit Coupon</h1>
      </div>
      <div className="admin-card">
        <CouponForm coupon={coupon} />
      </div>
    </>
  );
}
