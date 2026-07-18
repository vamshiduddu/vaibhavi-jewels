import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";
import ProductAiPanel from "@/components/admin/ProductAiPanel";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { subcategories: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  const productForForm = {
    ...product,
    price: toNumber(product.price),
    compareAtPrice: product.compareAtPrice === null ? null : toNumber(product.compareAtPrice),
    purchaseCost: product.purchaseCost === null ? null : toNumber(product.purchaseCost),
    salePrice: product.salePrice === null ? null : toNumber(product.salePrice),
    weightGrams: product.weightGrams,
  };

  return (
    <>
      <div className="admin-header">
        <h1>Edit Product</h1>
      </div>
      <div className="admin-two-col" style={{ alignItems: "start" }}>
        <div className="admin-card">
          <ProductForm product={productForForm} categories={categories} collections={collections} />
        </div>
        <ProductAiPanel
          productId={product.id}
          instagramCaption={product.aiInstagramCaption}
          youtubeTitle={product.aiYoutubeTitle}
          youtubeDescription={product.aiYoutubeDescription}
          media={product.images}
        />
      </div>
    </>
  );
}
