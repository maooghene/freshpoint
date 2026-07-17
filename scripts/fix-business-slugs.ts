// scripts/fix-business-slugs.ts
import { prisma } from "@/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars first, keep spaces/hyphens
    .trim()
    .replace(/\s+/g, "-") // collapse whitespace to single hyphens
    .replace(/-+/g, "-") // collapse any repeated hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

async function main() {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, slug: true },
  });

  console.log(`Checking ${businesses.length} business slugs...`);

  let fixedCount = 0;

  for (const business of businesses) {
    const correctBase = generateSlug(business.name);

    // Skip if the current slug is already clean (matches the base, or is a
    // valid "base-N" collision-suffixed variant of it)
    const isClean =
      business.slug === correctBase ||
      new RegExp(`^${correctBase}-\\d+$`).test(business.slug);

    if (isClean) continue;

    // Recompute slug, respecting existing collision-avoidance logic,
    // but exclude this business's own current row from the collision check
    let newSlug = correctBase;
    let counter = 1;

    while (
      await prisma.business.findFirst({
        where: {
          slug: newSlug,
          NOT: { id: business.id },
        },
      })
    ) {
      newSlug = `${correctBase}-${counter}`;
      counter++;
    }

    if (newSlug === business.slug) continue; // no actual change needed

    await prisma.business.update({
      where: { id: business.id },
      data: { slug: newSlug },
    });

    console.log(`Fixed: "${business.slug}" -> "${newSlug}" (${business.name})`);
    fixedCount++;
  }

  console.log(`Done. Fixed ${fixedCount} slug(s).`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
