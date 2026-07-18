import InfoPage from "@/components/InfoPage";

export const metadata = {
  title: "Maintenance",
  description: "Care and maintenance guidance for Vaibhavi Jewels pieces.",
};

export default function MaintenancePage() {
  return (
    <InfoPage
      title="Maintenance"
      intro="Proper storage and daily care help your jewellery maintain its finish, shine, and presentation for longer."
      sections={[
        {
          title: "Daily Care",
          body: [
            "Keep jewellery away from sweat, moisture, and direct contact with perfume, hairspray, lotion, or other chemical products.",
            "After use, wipe each piece gently with a soft dry cloth before storing it again.",
          ],
        },
        {
          title: "Storage",
          body: [
            "Store pieces in a dry place and avoid mixing multiple items loosely together, as friction can affect finish and detailing.",
            "Where possible, keep items in separate pouches or compartments to reduce scratches and tangling.",
          ],
        },
        {
          title: "Handling Notes",
          body: [
            "Avoid bending, forcing clasps, or applying household coatings or substances to jewellery surfaces unless specifically recommended by the brand.",
            "If a piece needs cleaning or service guidance beyond standard wiping and storage, contact us before trying home remedies.",
          ],
        },
      ]}
    />
  );
}
