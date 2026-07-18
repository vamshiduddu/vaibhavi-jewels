import type { Address, Order, OrderItem } from "@prisma/client";

export type ReturnAddress = {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type ShippingLabelPayload = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  total: string;
  paidAt: string;
  source: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  itemCount: number;
  shippingPartner: string | null;
  awbCode: string | null;
  shippingCode: string | null;
  returnTo: ReturnAddress;
};

export function getReturnAddress(settings: Record<string, string>): ReturnAddress {
  return {
    name: settings.return_to_name?.trim() || settings.site_name?.trim() || "Vaibhavi Jewels",
    phone: settings.return_to_phone?.trim() || settings.whatsapp_display?.trim() || "",
    line1: settings.return_to_line1?.trim() || "",
    line2: settings.return_to_line2?.trim() || null,
    city: settings.return_to_city?.trim() || "",
    state: settings.return_to_state?.trim() || "",
    pincode: settings.return_to_pincode?.trim() || "",
    country: settings.return_to_country?.trim() || "India",
  };
}

export function hasCompleteReturnAddress(address: ReturnAddress): boolean {
  return Boolean(address.line1 && address.city && address.state && address.pincode && address.country);
}

type OrderWithLabelData = Order & {
  address: Address | null;
  items: Pick<OrderItem, "quantity">[];
};

export function toShippingLabel(
  order: OrderWithLabelData,
  formatMoney: (value: Order["grandTotal"]) => string,
  paidAt: string,
  returnTo: ReturnAddress,
): ShippingLabelPayload | null {
  if (!order.address) return null;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    total: formatMoney(order.grandTotal),
    paidAt,
    source: order.source.replace(/_/g, " "),
    line1: order.address.line1,
    line2: order.address.line2,
    city: order.address.city,
    state: order.address.state,
    pincode: order.address.pincode,
    country: order.address.country,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    shippingPartner: order.shippingPartner,
    awbCode: order.awbCode,
    shippingCode: order.shippingCode,
    returnTo,
  };
}
