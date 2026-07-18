import Link from "next/link";
import PrintButton from "@/components/admin/PrintButton";
import { renderBarcodeSvg } from "@/lib/barcode";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

type LabelSize = "38x25" | "50x25" | "60x30";

type Props = {
  searchParams: Promise<{ productId?: string; size?: string }>;
};

const SIZES: Array<{ value: LabelSize; label: string }> = [
  { value: "38x25", label: "38 x 25 mm" },
  { value: "50x25", label: "50 x 25 mm" },
  { value: "60x30", label: "60 x 30 mm" },
];

export default async function AdminBarcodesPage({ searchParams }: Props) {
  await requireAdmin("barcodes");
  const { productId, size } = await searchParams;
  const labelSize: LabelSize = SIZES.some((item) => item.value === size)
    ? (size as LabelSize)
    : "50x25";

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
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="secondary-button" href="/admin/products">
            Manage Products
          </Link>
          <PrintButton className="primary-button" sheetId="barcode-print-sheet" title="Vaibhavi Barcode Labels">
            Print Labels
          </PrintButton>
        </div>
      </div>

      <div className="subcategory-strip" style={{ justifyContent: "flex-start", marginBottom: 18 }}>
        {SIZES.map((item) => {
          const href = productId
            ? `/admin/barcodes?productId=${productId}&size=${item.value}`
            : `/admin/barcodes?size=${item.value}`;
          return (
            <Link key={item.value} href={href} className={labelSize === item.value ? "active" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 18px" }}>
        Printing uses fixed physical label sizes. Current preset: <strong>{SIZES.find((item) => item.value === labelSize)?.label}</strong>.
      </p>

      <div id="barcode-print-sheet" className="barcode-print-sheet" data-size={labelSize}>
        {labels.map(({ product, svg }) => (
          <article key={product.id} className="barcode-print-card">
            <div className="barcode-print-head">
              <strong className="barcode-print-title">{product.title}</strong>
              <span className="barcode-print-sku">{product.sku || "No SKU"}</span>
              <span className="barcode-print-price">{formatINR(product.price)}</span>
            </div>
            {svg ? (
              <div
                className="barcode-print-code"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 11, margin: 0 }}>
                Save the product once to generate its barcode.
              </p>
            )}
            <div className="barcode-print-foot">
              <span>{product.barcodeValue ?? "Pending"}</span>
              <span>{product.barcodeType}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
