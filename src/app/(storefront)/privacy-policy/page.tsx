import InfoPage from "@/components/InfoPage";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Vaibhavi Jewels covering customer information, payments, and communication handling.",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="This policy explains how Vaibhavi Jewels collects, uses, and protects customer information across website, social, and store-assisted orders."
      sections={[
        {
          title: "Information We Collect",
          body: [
            "We may collect name, phone number, email address, shipping address, order details, and communication context when you place an order or contact us.",
            "We also use operational data such as product selection, payment status, fulfilment status, and customer support history to process orders and improve service.",
          ],
        },
        {
          title: "How We Use Information",
          body: [
            "Customer data is used to confirm orders, arrange delivery, support returns or exchanges where applicable, respond to service requests, and maintain order records.",
            "We may also use contact information for order updates, payment coordination, catalogue assistance, and post-purchase support connected to your transaction.",
          ],
        },
        {
          title: "Payments and Third Parties",
          body: [
            "Online payments may be processed through Razorpay or other approved payment providers. Payment processors handle their own secure payment workflows under their respective policies.",
            "Operational tools, hosting services, or communications platforms may store limited data required to run the storefront, admin operations, or customer support channels.",
          ],
        },
        {
          title: "Cookies and Security",
          body: [
            "The website may use cookies or local storage for cart continuity, session handling, and performance improvements.",
            "We take reasonable steps to protect customer data, but no internet transmission or storage system can be guaranteed to be completely secure.",
          ],
        },
      ]}
    />
  );
}
