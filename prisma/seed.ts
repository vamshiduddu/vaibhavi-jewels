import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CATEGORIES = [
  "Earrings",
  "Necklace",
  "Long Haram",
  "Bangles",
  "Choker",
  "Mala",
  "Hipbelt",
  "Vangi",
  "Nose Pin",
  "Finger Ring",
  "Maang Tikka",
  "Hair Accessories",
];

const COLLECTIONS = [
  { name: "Antique", description: "Timeless antique-finish jewellery for traditional occasions." },
  { name: "American Diamond", description: "Bright AD sparkle for parties and evening looks." },
  { name: "Victorian Diamond", description: "Regal Victorian diamond styling with vintage charm." },
];

const SECTIONS = [
  {
    key: "announcement",
    body: "Pan India Shipping Available | WhatsApp Orders | Video Call Facility Available",
    sortOrder: 0,
  },
  {
    key: "hero",
    kicker: "Elegant Designs | Premium Quality | Pan India Shipping",
    title: "Vaibhavi Jewels",
    body: "Not just jewellery, a statement of grace. Curated for the modern woman.",
    sortOrder: 1,
  },
  {
    key: "intro",
    kicker: "Designed with care",
    title: "Elegant one gram jewellery for every occasion.",
    body: "Vaibhavi Jewels brings together timeless beauty, premium finishing, and pan India delivery so every order feels thoughtful from first look to doorstep.",
    sortOrder: 2,
  },
  {
    key: "new_arrivals",
    kicker: "New arrivals",
    title: "Fresh styles ready to order.",
    sortOrder: 3,
  },
  {
    key: "bridal",
    kicker: "Occasion styling",
    title: "Curated jewellery for the modern woman.",
    body: "Explore coordinated pieces for traditional outfits, party looks, family events, and gifting. Share your occasion and we can help you choose a matching style.",
    ctaText: "DM to Order",
    sortOrder: 4,
  },
  {
    key: "payments",
    kicker: "Secure checkout",
    title: "Pay securely online with Razorpay.",
    body: "Order online with UPI, cards, or netbanking through Razorpay. Prefer WhatsApp? Message us and we will help you complete your order.",
    sortOrder: 5,
  },
  {
    key: "contact",
    kicker: "Visit Vaibhavi Jewels",
    title: "Order online or DM us.",
    body: "Pan India shipping with WhatsApp support and video call assistance for every order.",
    sortOrder: 6,
  },
];

const SETTINGS: Record<string, string> = {
  site_name: "Vaibhavi Jewels",
  site_domain: "vaibhavijewels.in",
  whatsapp_phone: "918074486906",
  whatsapp_display: "+91 80744 86906",
  instagram_url: "https://www.instagram.com/vaibhavijewelers",
  instagram_handle: "@vaibhavijewelers",
  facebook_url: "https://www.facebook.com/share/18NRp8p9z8/",
  youtube_url: "https://www.youtube.com/@vaibhavijewelers",
  footer_about:
    "Elegant one gram jewellery curated for celebrations, gifting, and everyday shine.",
  shipping_flat_rate: "79",
  free_shipping_threshold: "999",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  console.log("Seeding categories...");
  for (const [index, name] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: slugify(name) },
      create: { name, slug: slugify(name), sortOrder: index, active: true },
      update: { name, sortOrder: index },
    });
  }

  console.log("Seeding collections...");
  for (const [index, collection] of COLLECTIONS.entries()) {
    await db.collection.upsert({
      where: { slug: slugify(collection.name) },
      create: {
        name: collection.name,
        slug: slugify(collection.name),
        description: collection.description,
        sortOrder: index,
        active: true,
        featured: true,
      },
      update: { description: collection.description, sortOrder: index },
    });
  }

  console.log("Seeding homepage sections...");
  for (const section of SECTIONS) {
    const { key, ...data } = section;
    await db.homepageSection.upsert({
      where: { key },
      create: { key, ...data, active: true },
      update: data,
    });
  }

  console.log("Seeding site settings...");
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: {}, // do not overwrite admin-edited values
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@vaibhavijewels.in";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (password) {
    console.log(`Seeding admin user ${email}...`);
    const passwordHash = await bcrypt.hash(password, 12);
    await db.adminUser.upsert({
      where: { email },
      create: { email, name: "Vaibhavi Admin", passwordHash, role: "super_admin" },
      update: { passwordHash },
    });
  } else {
    console.warn("SEED_ADMIN_PASSWORD not set — skipping admin user seed.");
  }

  console.log("Seeding a sample product per category (draft status)...");
  const earrings = await db.category.findUnique({ where: { slug: "earrings" } });
  const antique = await db.collection.findUnique({ where: { slug: "antique" } });
  if (earrings && antique) {
    await db.product.upsert({
      where: { slug: "antique-jhumka-earrings" },
      create: {
        title: "Antique Jhumka Earrings",
        slug: "antique-jhumka-earrings",
        shortDescription: "Classic antique-finish jhumkas for festive and daily wear.",
        description:
          "Handpicked antique jhumka earrings with a premium one gram gold finish. Lightweight, skin-friendly, and perfect for festive occasions, gifting, and everyday elegance.",
        price: 499,
        compareAtPrice: 699,
        sku: "VJ-EAR-0001",
        stockQuantity: 10,
        categoryId: earrings.id,
        collectionId: antique.id,
        tags: ["earrings", "antique", "jhumka"],
        status: "active",
        featured: true,
        badge: "New Arrival",
        images: {
          create: [
            { url: "/earrings-1200.jpeg", alt: "Antique Jhumka Earrings", featured: true, sortOrder: 0 },
            { url: "/earrings-1000.jpeg", alt: "Antique Jhumka Earrings — detail", sortOrder: 1 },
          ],
        },
      },
      update: {},
    });
  }

  console.log("Seeding welcome coupon...");
  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 499,
      maxDiscount: 300,
      active: true,
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
