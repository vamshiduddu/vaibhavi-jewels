import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ query: q, items: [] });
  }

  const products = await db.product.findMany({
    where: {
      status: "active",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcodeValue: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { collection: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    take: 12,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      images: {
        where: { kind: "image" },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: 1,
      },
    },
  });

  return NextResponse.json({
    query: q,
    items: products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      barcodeValue: product.barcodeValue,
      price: Number(product.price),
      imageUrl: product.images[0]?.url ?? null,
    })),
  });
}
