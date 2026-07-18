import { NextResponse } from "next/server";
import { getCartDetail } from "@/lib/cart";

export async function GET() {
  const cart = await getCartDetail();
  return NextResponse.json({
    id: cart.id,
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    couponCode: cart.couponCode,
    couponDiscount: cart.couponDiscount,
    shipping: cart.shipping,
    grandTotal: cart.grandTotal,
  });
}
