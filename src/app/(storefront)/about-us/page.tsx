import InfoPage from "@/components/InfoPage";

export const metadata = {
  title: "About Us",
  description: "Learn more about Vaibhavi Jewels, our jewellery philosophy, and how we serve customers online and in store.",
};

export default function AboutUsPage() {
  return (
    <InfoPage
      title="About Us"
      intro="Vaibhavi Jewels is built around festive styling, daily elegance, and direct customer relationships across online, social, and in-store journeys."
      sections={[
        {
          title: "Our Brand",
          body: [
            "We focus on jewellery that feels occasion-ready without losing everyday wearability. The catalogue is curated to help customers style weddings, gifting moments, festive looks, and repeat-wear favourites from one place.",
            "Our storefront and admin systems are designed to keep catalogue presentation, pricing, and stock aligned so that the same product story carries from discovery to fulfilment.",
          ],
        },
        {
          title: "What We Sell",
          body: [
            "Vaibhavi Jewels offers one gram and fine-finish jewellery across categories such as earrings, bangles, necklaces, and other festive accessories.",
            "We keep collections dynamic, with categories and subcategories evolving as the catalogue grows and new launches are added.",
          ],
        },
        {
          title: "How We Serve Customers",
          body: [
            "Customers can browse and order through the website, connect with us through WhatsApp and social channels, or visit the store directly for assisted purchases.",
            "Each of these journeys is intended to map back to a central catalogue and inventory system so product availability and customer service remain consistent.",
          ],
        },
      ]}
    />
  );
}
