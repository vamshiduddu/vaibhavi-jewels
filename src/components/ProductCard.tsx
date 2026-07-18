import Link from "next/link";
import type { Product, ProductImage, Promotion } from "@prisma/client";
import AddToCartButton from "@/components/AddToCartButton";
import { effectivePrice } from "@/lib/pricing";
import { formatINR } from "@/lib/format";

type Props = {
  product: Product & { images: ProductImage[] };
  promotions: Promotion[];
};

export default function ProductCard({ product, promotions }: Props) {
  const { price, compareAt, label } = effectivePrice(product, promotions);
  const image = product.images[0];
  const offPercent =
    compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

  return (
    <article className="product-card">
      {label ? <span className="product-badge">{label}</span> : null}
      <Link href={`/products/${product.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image?.url ?? "/vaibhavi-logo.png"}
          alt={image?.alt ?? product.title}
          loading="lazy"
        />
      </Link>
      <div className="product-card-body">
        <h3>
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>
        <div className="price-row">
          <span className="price-now">{formatINR(price)}</span>
          {compareAt ? <span className="price-was">{formatINR(compareAt)}</span> : null}
          {offPercent ? <span className="price-off">{offPercent}% off</span> : null}
        </div>
        <div className="product-card-actions">
          <AddToCartButton productId={product.id} disabled={product.stockQuantity < 1} />
        </div>
      </div>
    </article>
  );
}
