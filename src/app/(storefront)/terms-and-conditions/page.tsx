import InfoPage from "@/components/InfoPage";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions governing the use of Vaibhavi Jewels website and order services.",
};

export default function TermsAndConditionsPage() {
  return (
    <InfoPage
      title="Terms & Conditions"
      intro="By using this website or purchasing from Vaibhavi Jewels, you agree to the operating, fulfilment, and usage terms described here."
      sections={[
        {
          title: "Store Use",
          body: [
            "You agree to provide accurate order, payment, and contact information when using our website or placing assisted orders through social or direct support channels.",
            "You must not use the website or any store services for unlawful, abusive, fraudulent, or disruptive purposes.",
          ],
        },
        {
          title: "Catalogue and Pricing",
          body: [
            "Product availability, pricing, offers, and promotional details may change without prior notice. We aim to keep catalogue information accurate, but errors may occasionally occur.",
            "We reserve the right to correct pricing, stock, or content issues and to cancel or adjust orders when necessary for accuracy or operational integrity.",
          ],
        },
        {
          title: "Orders and Fulfilment",
          body: [
            "Order confirmation does not override stock availability or verification requirements. Orders may be reviewed for payment, fulfilment feasibility, or fraud prevention.",
            "Shipping timelines, assisted order handling, and post-order support are governed by the policies published on this site.",
          ],
        },
        {
          title: "Liability and Updates",
          body: [
            "Vaibhavi Jewels is not liable for indirect or incidental losses arising from use of the website, service interruptions, or third-party platform dependencies except where required by law.",
            "These terms may be updated as the business, catalogue, or operations evolve. Continued use of the website after updates indicates acceptance of the revised terms.",
          ],
        },
      ]}
    />
  );
}
