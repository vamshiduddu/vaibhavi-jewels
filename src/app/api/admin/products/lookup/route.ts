import { NextResponse } from "next/server";
import { getAdminSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (
    !session ||
    !hasPermission(session.role, "offline-sales", {
      grantedPermissions: session.grantedPermissions,
      deniedPermissions: session.deniedPermissions,
    })
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ items: [] });

  const products = await db.product.findMany({
    where: {
      status: { not: "archived" },
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcodeValue: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 15,
    select: {
      id: true,
      title: true,
      sku: true,
      barcodeValue: true,
      price: true,
      stockQuantity: true,
      status: true,
    },
  });

  return NextResponse.json({
    items: products.map((product) => ({
      ...product,
      price: Number(product.price),
    })),
  });
}
