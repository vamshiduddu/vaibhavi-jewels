import InfoPage from "@/components/InfoPage";

export const metadata = {
  title: "Shipping & Delivery",
  description: "Shipping and delivery policy for Vaibhavi Jewels orders across domestic and future international destinations.",
};

export default function ShippingAndDeliveryPage() {
  return (
    <InfoPage
      title="Shipping & Delivery"
      intro="Vaibhavi Jewels processes each order against current stock, payment confirmation, and delivery feasibility before dispatch."
      sections={[
        {
          title: "Dispatch Workflow",
          body: [
            "Orders are prepared after confirmation, stock allocation, and payment verification where applicable. Dispatch timelines may vary by order volume, product type, or special handling needs.",
            "Customers receive updates through the checkout channel used for the order, including website, WhatsApp, or other assisted channels.",
          ],
        },
        {
          title: "Domestic Delivery",
          body: [
            "Domestic orders are delivered using available courier services based on the order destination and operational coverage.",
            "Shipping fees may depend on active pricing rules, order value, package weight, destination, and any special fulfilment constraints applied at checkout.",
          ],
        },
        {
          title: "International Support",
          body: [
            "International shipping capability is being expanded country by country. Final charges may depend on package weight, destination country, customs requirements, and delivery mode.",
            "Any customs duties, taxes, or destination-side import charges are generally the responsibility of the receiving customer unless explicitly stated otherwise at purchase time.",
          ],
        },
        {
          title: "Delivery Proof and Claims",
          body: [
            "If you receive a package with damage or discrepancy, contact us promptly with order details and clear opening evidence where possible.",
            "Unboxing proof helps us validate courier-related issues and move replacement or support decisions faster.",
          ],
        },
      ]}
    />
  );
}
