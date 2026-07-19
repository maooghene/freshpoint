// scripts/seed-categories.ts
import prisma from "@/lib/prisma";

const businessCategories = [
  { label: "Salons", value: "SALON" },
  { label: "Spas", value: "SPA" },
  { label: "Aesthetics", value: "CLINIC" },
  { label: "Wellness & Health", value: "WELLNESS" },
  { label: "Other", value: "OTHER" },
];

const itemCategories = [
  "Barber",
  "Salon",
  "Spa",
  "Wellness",
  "Massage",
  "Skincare",
  "Nails",
  "Makeup",
  "Therapy",
  "Fitness",
];

async function main() {
  for (const cat of businessCategories) {
    await prisma.businessCategory.upsert({
      where: { value: cat.value },
      update: {},
      create: cat,
    });
  }

  for (const name of itemCategories) {
    await prisma.itemCategory.upsert({
      where: { name },
      update: {},
      create: { name, scope: "BOTH" },
    });
  }

  console.log("Categories seeded.");
}

main().finally(() => prisma.$disconnect());
