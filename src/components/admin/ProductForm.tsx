"use client";

import type { Category, Collection, ProductImage, Subcategory } from "@prisma/client";
import { useMemo, useState } from "react";
import MediaField from "@/components/admin/MediaField";
import { saveProduct } from "@/lib/admin/catalog-actions";

type ProductFormValue = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  purchaseCost: number | null;
  weightGrams: number;
  sku: string | null;
  barcodeValue: string | null;
  barcodeType: "code39" | "code128" | "qr";
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string | null;
  subcategoryId: string | null;
  collectionId: string | null;
  tags: string[];
  status: "draft" | "active" | "archived";
  featured: boolean;
  badge: string | null;
  color: string | null;
  material: string | null;
  occasion: string | null;
  salePrice: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  aiInstagramCaption: string | null;
  aiYoutubeTitle: string | null;
  aiYoutubeDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
};

type Props = {
  product?: ProductFormValue | null;
  categories: (Category & { subcategories: Subcategory[] })[];
  collections: Collection[];
};

function dateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function ProductForm({ product, categories, collections }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.categoryId ?? "");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(product?.subcategoryId ?? "");

  const subcategories = useMemo(
    () =>
      categories.flatMap((category) =>
        category.subcategories.map((subcategory) => ({
          ...subcategory,
          categoryName: category.name,
        })),
      ),
    [categories],
  );
  const visibleSubcategories = useMemo(
    () => subcategories.filter((subcategory) => subcategory.categoryId === selectedCategoryId),
    [selectedCategoryId, subcategories],
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
          Price (Rs.)
          <input name="price" type="number" step="0.01" min="0" required defaultValue={product ? Number(product.price) : ""} />
        </label>
        <label>
          Compare-at Price (Rs.)
          <input
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.compareAtPrice ? Number(product.compareAtPrice) : ""}
          />
        </label>
      </div>

      <div className="form-row-2">
        <label>
          SKU
          <input name="sku" defaultValue={product?.sku ?? ""} />
        </label>
        <label>
          Barcode Value
          <input name="barcodeValue" defaultValue={product?.barcodeValue ?? ""} />
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Barcode Type
          <select name="barcodeType" defaultValue={product?.barcodeType ?? "code39"}>
            <option value="code39">Code 39</option>
            <option value="code128">Code 128</option>
            <option value="qr">QR</option>
          </select>
        </label>
        <label>
          Stock Quantity
          <input name="stockQuantity" type="number" min="0" defaultValue={product?.stockQuantity ?? 0} />
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Purchase Cost (Rs.)
          <input
            name="purchaseCost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.purchaseCost ? Number(product.purchaseCost) : ""}
          />
        </label>
        <label>
          Weight (grams)
          <input name="weightGrams" type="number" min="1" defaultValue={product?.weightGrams ?? 250} />
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Low Stock Threshold
          <input name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 3} />
        </label>
        <div />
      </div>

      <div className="form-row-2">
        <label>
          Category
          <select
            name="categoryId"
            value={selectedCategoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              setSelectedCategoryId(nextCategoryId);
              setSelectedSubcategoryId((current) =>
                subcategories.some((subcategory) => subcategory.id === current && subcategory.categoryId === nextCategoryId)
                  ? current
                  : "",
              );
            }}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subcategory
          <select
            name="subcategoryId"
            value={selectedSubcategoryId}
            onChange={(event) => setSelectedSubcategoryId(event.target.value)}
            disabled={!selectedCategoryId}
          >
            <option value="">None</option>
            {visibleSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row-2">
        <label>
          Collection
          <select name="collectionId" defaultValue={product?.collectionId ?? ""}>
            <option value="">None</option>
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

      <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 -8px" }}>
        Media (images upload to storage; video links embed in the gallery)
      </p>
      <MediaField
        initial={
          product?.images.map((i) => ({
            url: i.url,
            kind: (i.kind === "video" ? "video" : "image") as "image" | "video",
            alt: i.alt,
          })) ?? []
        }
        uploadContext={{
          folder: product?.id ? `products/${product.id}` : "products/draft",
          entityType: "product",
          entityId: product?.id ?? null,
          entityLabel: product?.sku ?? null,
        }}
      />

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
          Sale Price (Rs., optional)
          <input
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.salePrice ? Number(product.salePrice) : ""}
          />
        </label>
        <div />
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
