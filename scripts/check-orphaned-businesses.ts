// scripts/check-orphaned-businesses.ts
import prisma from "@/lib/prisma";

async function main() {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, ownerId: true },
  });

  for (const b of businesses) {
    const owner = await prisma.user.findUnique({ where: { id: b.ownerId } });
    if (!owner) {
      console.log(
        `ORPHANED: Business "${b.name}" (${b.id}) → missing owner ${b.ownerId}`,
      );
    }
  }
}

main().finally(() => prisma.$disconnect());
