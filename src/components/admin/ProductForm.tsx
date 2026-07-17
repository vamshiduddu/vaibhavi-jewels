import type {
  Category,
  Collection,
  Product,
  ProductImage,
  Subcategory,
} from "@prisma/client";
import { saveProduct } from "@/lib/admin/catalog-actions";

type Props = {
  product?: (Product & { images: ProductImage[] }) | null;
  categories: (Category & { subcategories: Subcategory[] })[];
  collections: Collection[];
};

function dateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function ProductForm({ product, categories, collections }: Props) {
  const subcategories = categories.flatMap((c) =>
    c.subcategories.map((s) => ({ ...s, categoryName: c.name })),
  );

  return (
    <form action={saveProduct} className="admin-form">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <label>
        Title
        <input name="title" required defaultValue={product?.title ?? ""} />
      </label>
      <label>
        Slug (leave blank to auto-generate)
        <input name="slug" defaultValue={product?.slug ?? ""} />
      </label>
      <label>
        Short Description
        <input name="shortDescription" defaultValue={product?.shortDescription ?? ""} />
      </label>
      <label>
        Full Description
        <textarea name="description" defaultValue={product?.description ?? ""} />
      </label>

      <div className="form-row-2">
        <label>
          Price (₹)
          <input name="price" type="number" step="0.01" min="0" required defaultValue={product ? Number(product.price) : ""} />
        </label>
        <label>
          Compare-at Price (₹)
          <input name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={product?.compareAtPrice ? Number(product.compareAtPrice) : ""} />
        </label>
      </div>

      <div className="form-row-2">
        <label>
          SKU
          <input name="sku" defaultValue={product?.sku ?? ""} />
        </label>
        <label>
          Stock Quantity
          <input name="stockQuantity" type="number" min="0" defaultValue={product?.stockQuantity ?? 0} />
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Category
          <select name="categoryId" defaultValue={product?.categoryId ?? ""}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subcategory
          <select name="subcategoryId" defaultValue={product?.subcategoryId ?? ""}>
            <option value="">— None —</option>
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
          Collection
          <select name="collectionId" defaultValue={product?.collectionId ?? ""}>
            <option value="">— None —</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={product?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <label>
        Image URLs (one per line, first is the featured image)
        <textarea
          name="images"
          placeholder="https://res.cloudinary.com/.../earrings-1.jpg"
          defaultValue={product?.images.map((i) => i.url).join("\n") ?? ""}
        />
      </label>

      <label>
        Tags (comma separated)
        <input name="tags" defaultValue={product?.tags.join(", ") ?? ""} />
      </label>

      <div className="form-row-2">
        <label>
          Badge (e.g. Sale, Limited Offer, Best Seller, New Arrival)
          <input name="badge" defaultValue={product?.badge ?? ""} />
        </label>
        <label>
          Sort Order
          <input name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} />
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Colour
          <input name="color" defaultValue={product?.color ?? ""} />
        </label>
        <label>
          Material
          <input name="material" defaultValue={product?.material ?? ""} />
        </label>
      </div>
      <label>
        Occasion
        <input name="occasion" defaultValue={product?.occasion ?? ""} />
      </label>

      <div className="form-row-2">
        <label>
          Sale Price (₹, optional)
          <input name="salePrice" type="number" step="0.01" min="0" defaultValue={product?.salePrice ? Number(product.salePrice) : ""} />
        </label>
        <label>
          Low Stock Threshold
          <input name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 3} />
        </label>
      </div>
      <div className="form-row-2">
        <label>
          Sale Starts
          <input name="saleStartsAt" type="datetime-local" defaultValue={dateInputValue(product?.saleStartsAt)} />
        </label>
        <label>
          Sale Ends
          <input name="saleEndsAt" type="datetime-local" defaultValue={dateInputValue(product?.saleEndsAt)} />
        </label>
      </div>

      <label className="checkbox-label">
        <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} />
        Featured on homepage
      </label>

      <label>
        SEO Title
        <input name="seoTitle" defaultValue={product?.seoTitle ?? ""} />
      </label>
      <label>
        SEO Description
        <input name="seoDescription" defaultValue={product?.seoDescription ?? ""} />
      </label>

      <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
        Save Product
      </button>
    </form>
  );
}
