import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/orders";

export async function POST(request: Request) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ ok: false, error: "Missing payment details." }, { status: 400 });
  }

  const valid = verifyCheckoutSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 400 });
  }

  const payment = await db.payment.findUnique({
    where: { razorpayOrderId: razorpay_order_id },
  });
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Unknown payment." }, { status: 404 });
  }

  await markOrderPaid({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

  // clear the cart after a successful payment
  const jar = await cookies();
  const cartId = jar.get("vj_cart")?.value;
  if (cartId) {
    await db.cart.deleteMany({ where: { id: cartId } });
    jar.delete("vj_cart");
  }

  return NextResponse.json({ ok: true, orderId: payment.orderId });
}
