import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_PRODUCTS } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding categories...");
  const bouquets = await prisma.category.upsert({
    where: { slug: "bouquets" },
    update: {},
    create: {
      name: "Bouquets",
      slug: "bouquets",
      description: "Hand-tied luxury bouquets from our Dubai atelier.",
      sortOrder: 0,
    },
  });

  const baskets = await prisma.category.upsert({
    where: { slug: "baskets" },
    update: {},
    create: {
      name: "Baskets & Arrangements",
      slug: "baskets",
      description: "Curated basket arrangements for gifting and events.",
      sortOrder: 1,
    },
  });

  const categoryBySlug: Record<string, string> = {
    bouquets: bouquets.id,
    baskets: baskets.id,
  };

  console.log(`Seeding ${SEED_PRODUCTS.length} products...`);
  for (const p of SEED_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        categoryId: categoryBySlug[p.categorySlug],
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.description.length > 120 ? p.description.slice(0, 117) + "..." : p.description,
        priceMinor: p.priceMinor,
        sku: p.sku,
        mainImage: p.mainImage,
        isFeatured: p.isFeatured,
        status: "PUBLISHED",
        inventory: {
          create: {
            quantity: 25,
            reservedQuantity: 0,
            lowStockThreshold: 5,
          },
        },
      },
    });

    // Standard/Premium/Luxury size option, mirroring what most florist SKUs need.
    // Business should adjust price deltas per product in the admin panel — these are neutral defaults (delta 0)
    // flagged here rather than invented pricing.
    const existingGroup = await prisma.productOptionGroup.findFirst({
      where: { productId: product.id, name: "Size" },
    });
    if (!existingGroup) {
      await prisma.productOptionGroup.create({
        data: {
          productId: product.id,
          name: "Size",
          required: true,
          values: {
            create: [
              { label: "Standard", priceDeltaMinor: 0, sortOrder: 0 },
              { label: "Premium", priceDeltaMinor: 10000, sortOrder: 1 }, // +AED 100, placeholder — confirm with business
              { label: "Luxury", priceDeltaMinor: 25000, sortOrder: 2 }, // +AED 250, placeholder — confirm with business
            ],
          },
        },
      });
    }
  }

  console.log("Seeding delivery zones (Dubai only — placeholder values, confirm with business)...");
  await prisma.deliveryZone.upsert({
    where: { id: "seed-dubai-standard" },
    update: {},
    create: {
      id: "seed-dubai-standard",
      name: "Dubai — Standard",
      area: "All areas",
      emirate: "Dubai",
      feeMinor: 3000, // AED 30 — placeholder, confirm with business
      minimumOrderMinor: 0,
      isActive: true,
    },
  });

  console.log("Seeding delivery slots...");
  const slots = [
    { name: "Morning (9am – 12pm)", startTime: "09:00", endTime: "12:00" },
    { name: "Afternoon (12pm – 4pm)", startTime: "12:00", endTime: "16:00" },
    { name: "Evening (4pm – 8pm)", startTime: "16:00", endTime: "20:00" },
  ];
  for (const s of slots) {
    const existing = await prisma.deliverySlot.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.deliverySlot.create({ data: { ...s, maxOrders: 50, isActive: true } });
    }
  }

  console.log("Seeding site settings...");
  await prisma.siteSetting.upsert({
    where: { key: "free_delivery_threshold_minor" },
    update: {},
    create: { key: "free_delivery_threshold_minor", value: 30000 }, // AED 300, matches existing site copy
  });
  await prisma.siteSetting.upsert({
    where: { key: "same_day_cutoff_time" },
    update: {},
    create: { key: "same_day_cutoff_time", value: "15:00" }, // placeholder — confirm with business
  });
  await prisma.siteSetting.upsert({
    where: { key: "whatsapp_number" },
    update: {},
    create: { key: "whatsapp_number", value: "971568743084" },
  });
  await prisma.siteSetting.upsert({
    where: { key: "tax_rate_percent" },
    update: {},
    create: { key: "tax_rate_percent", value: 0 }, // no tax rate confirmed — do not invent one
  });

  // Admin account: password is NOT hard-coded. Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
  // as env vars before running `npm run seed`, or create the admin via a one-off script later.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Admin account created for ${adminEmail}`);
  } else {
    console.log(
      "Skipped admin creation — set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars to create one."
    );
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
