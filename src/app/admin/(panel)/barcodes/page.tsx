import Link from "next/link";
import PrintButton from "@/components/admin/PrintButton";
import { renderBarcodeSvg } from "@/lib/barcode";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = {
  searchParams: Promise<{ productId?: string }>;
};

export default async function AdminBarcodesPage({ searchParams }: Props) {
  await requireAdmin("barcodes");
  const { productId } = await searchParams;
  const products = await db.product.findMany({
    where: {
      status: { not: "archived" },
      ...(productId ? { id: productId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: productId ? 1 : 40,
  });

  const labels = await Promise.all(
    products.map(async (product) => ({
      product,
      svg: product.barcodeValue
        ? await renderBarcodeSvg(
            product.barcodeValue,
            product.barcodeType === "qr"
              ? "qr"
              : product.barcodeType === "code128"
                ? "code128"
                : "code39",
          )
        : null,
    })),
  );

  return (
    <>
      <div className="admin-header">
        <h1>Barcodes</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="secondary-button" href="/admin/products">
            Manage Products
          </Link>
          <PrintButton className="primary-button">
            Print Labels
          </PrintButton>
        </div>
      </div>

      <div className="barcode-grid">
        {labels.map(({ product, svg }) => (
          <article key={product.id} className="barcode-card">
            <div>
              <strong>{product.title}</strong>
              <span>{product.sku || "No SKU"}</span>
            </div>
            {svg ? (
              <div
                className="barcode-svg"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <p style={{ color: "var(--muted)" }}>Save the product once to generate its barcode.</p>
            )}
            <div className="barcode-meta">
              <span>{product.barcodeValue ?? "Pending"}</span>
              <span>{product.barcodeType}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
