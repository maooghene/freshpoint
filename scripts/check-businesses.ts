import { prisma } from "../lib/prisma";

async function main() {
  const rows = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      paystackCustomerCode: true,
      owner: { select: { email: true } },
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0));
