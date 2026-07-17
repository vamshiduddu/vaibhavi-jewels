import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid, markOrderPaymentFailed } from "@/lib/orders";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentEntity = event.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const razorpayPaymentId = paymentEntity?.id;

  try {
    switch (event.event) {
      case "payment.captured":
        if (razorpayOrderId && razorpayPaymentId) {
          await markOrderPaid({ razorpayOrderId, razorpayPaymentId, rawPayload: paymentEntity });
        }
        break;
      case "payment.failed":
        if (razorpayOrderId) {
          await markOrderPaymentFailed(razorpayOrderId, paymentEntity);
        }
        break;
      default:
        break; // acknowledge unhandled events
    }
  } catch (error) {
    console.error("Razorpay webhook processing failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
