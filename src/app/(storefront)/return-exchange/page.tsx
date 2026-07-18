import InfoPage from "@/components/InfoPage";

export const metadata = {
  title: "Return & Exchange",
  description: "Return and exchange policy for Vaibhavi Jewels orders and assisted purchases.",
};

export default function ReturnExchangePage() {
  return (
    <InfoPage
      title="Return & Exchange"
      intro="Returns and exchanges are reviewed based on product condition, delivery state, and the type of issue reported."
      sections={[
        {
          title: "General Policy",
          body: [
            "Because jewellery purchases can involve styling preference, finish perception, and size considerations, not every order qualifies for return or exchange.",
            "Products that have been used, altered, damaged after delivery, or reported without sufficient issue context may not be eligible for exchange support.",
          ],
        },
        {
          title: "Transit Damage and Wrong Item Claims",
          body: [
            "If a product arrives damaged in transit or the wrong item is delivered, contact us quickly with a clear unboxing video and photos so we can validate the issue.",
            "Issue reporting should be done as soon as possible after delivery to help us review courier condition, packing quality, and order accuracy.",
          ],
        },
        {
          title: "Exchange Handling",
          body: [
            "When an exchange is approved, shipping direction, restocking condition, and replacement feasibility will depend on the specific product and destination.",
            "Special-size, custom-selected, or limited-stock items may have narrower exchange options than standard catalogue items.",
          ],
        },
        {
          title: "Cancellations",
          body: [
            "Orders already confirmed for processing, packing, or dispatch may not be cancellable, especially once stock has been reserved or fulfilment has started.",
            "If cancellation is still operationally possible, the support team will guide the next step based on payment and dispatch status.",
          ],
        },
      ]}
    />
  );
}
