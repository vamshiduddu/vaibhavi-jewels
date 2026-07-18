import Link from "next/link";
import BarcodeLabelManager from "@/components/admin/BarcodeLabelManager";
import { renderBarcodeSvg } from "@/lib/barcode";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

type LabelSize = "50x25";

type Props = {
  searchParams: Promise<{ productId?: string; size?: string }>;
};

const SIZES: Array<{ value: LabelSize; label: string }> = [
  { value: "50x25", label: "GLUN 50 x 25 mm thermal label" },
];

export default async function AdminBarcodesPage({ searchParams }: Props) {
  await requireAdmin("barcodes");
  const { productId, size } = await searchParams;
  const labelSize: LabelSize = SIZES.some((item) => item.value === size) ? (size as LabelSize) : "50x25";

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
        <Link className="secondary-button" href="/admin/products">
          Manage Products
        </Link>
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 18px" }}>
        Printing is locked to the thermal stock in use: <strong>{SIZES[0].label}</strong>.
      </p>

      <BarcodeLabelManager
        labelSize={labelSize}
        labels={labels.map(({ product, svg }) => ({
          id: product.id,
          title: product.title,
          sku: product.sku,
          price: formatINR(product.price),
          barcodeValue: product.barcodeValue,
          barcodeType: product.barcodeType,
          svg,
        }))}
      />
    </>
  );
}
