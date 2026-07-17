import type { Category, Collection, Product, Promotion, Subcategory } from "@prisma/client";
import { savePromotion } from "@/lib/admin/marketing-actions";

type Props = {
  promotion?: Promotion | null;
  categories: (Category & { subcategories: Subcategory[] })[];
  collections: Collection[];
  products: Pick<Product, "id" | "title">[];
};

function dateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function PromotionForm({ promotion, categories, collections, products }: Props) {
  const subcategories = categories.flatMap((c) =>
    c.subcategories.map((s) => ({ ...s, categoryName: c.name })),
  );

  return (
    <form action={savePromotion} className="admin-form">
      {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}
      <div className="form-row-2">
        <label>
          Name (internal)
          <input name="name" required defaultValue={promotion?.name ?? ""} />
        </label>
        <label>
          Label (shown to customers, e.g. Festive Sale)
          <input name="label" defaultValue={promotion?.label ?? ""} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Scope
          <select name="scope" required defaultValue={promotion?.scope ?? "sitewide"}>
            <option value="sitewide">Sitewide</option>
            <option value="category">Category</option>
            <option value="subcategory">Subcategory</option>
            <option value="collection">Collection</option>
            <option value="product">Product</option>
          </select>
        </label>
        <label>
          Discount Type
          <select name="discountType" required defaultValue={promotion?.discountType ?? "percentage"}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₹ off)</option>
          </select>
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Discount Value
          <input
            name="discountValue"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={promotion ? Number(promotion.discountValue) : ""}
          />
        </label>
        <label>
          Priority (higher wins ties)
          <input name="priority" type="number" defaultValue={promotion?.priority ?? 0} />
        </label>
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
        Set the target matching the scope you chose (others are ignored):
      </p>
      <div className="form-row-2">
        <label>
          Category target
          <select name="categoryId" defaultValue={promotion?.categoryId ?? ""}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subcategory target
          <select name="subcategoryId" defaultValue={promotion?.subcategoryId ?? ""}>
            <option value="">—</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.categoryName} / {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Collection target
          <select name="collectionId" defaultValue={promotion?.collectionId ?? ""}>
            <option value="">—</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Product target
          <select name="productId" defaultValue={promotion?.productId ?? ""}>
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Starts At
          <input name="startsAt" type="datetime-local" defaultValue={dateInputValue(promotion?.startsAt)} />
        </label>
        <label>
          Ends At
          <input name="endsAt" type="datetime-local" defaultValue={dateInputValue(promotion?.endsAt)} />
        </label>
      </div>
      <label className="checkbox-label">
        <input type="checkbox" name="active" defaultChecked={promotion?.active ?? true} />
        Active
      </label>
      <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
        Save Promotion
      </button>
    </form>
  );
}
