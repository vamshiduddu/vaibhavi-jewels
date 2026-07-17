import type { Coupon } from "@prisma/client";
import { saveCoupon } from "@/lib/admin/marketing-actions";

function dateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function CouponForm({ coupon }: { coupon?: Coupon | null }) {
  return (
    <form action={saveCoupon} className="admin-form">
      {coupon ? <input type="hidden" name="id" value={coupon.id} /> : null}
      <div className="form-row-2">
        <label>
          Code
          <input name="code" required defaultValue={coupon?.code ?? ""} style={{ textTransform: "uppercase" }} />
        </label>
        <label>
          Description
          <input name="description" defaultValue={coupon?.description ?? ""} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Discount Type
          <select name="discountType" required defaultValue={coupon?.discountType ?? "percentage"}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₹ off)</option>
          </select>
        </label>
        <label>
          Discount Value
          <input
            name="discountValue"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={coupon ? Number(coupon.discountValue) : ""}
          />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Min Order Value (₹)
          <input name="minOrderValue" type="number" step="0.01" min="0" defaultValue={coupon?.minOrderValue ? Number(coupon.minOrderValue) : ""} />
        </label>
        <label>
          Max Discount (₹, for % coupons)
          <input name="maxDiscount" type="number" step="0.01" min="0" defaultValue={coupon?.maxDiscount ? Number(coupon.maxDiscount) : ""} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Usage Limit (blank = unlimited)
          <input name="usageLimit" type="number" min="0" defaultValue={coupon?.usageLimit ?? ""} />
        </label>
        <label>
          Used
          <input disabled value={coupon?.usedCount ?? 0} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Starts At
          <input name="startsAt" type="datetime-local" defaultValue={dateInputValue(coupon?.startsAt)} />
        </label>
        <label>
          Ends At
          <input name="endsAt" type="datetime-local" defaultValue={dateInputValue(coupon?.endsAt)} />
        </label>
      </div>
      <label className="checkbox-label">
        <input type="checkbox" name="active" defaultChecked={coupon?.active ?? true} />
        Active
      </label>
      <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
        Save Coupon
      </button>
    </form>
  );
}
