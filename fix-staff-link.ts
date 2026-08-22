import { prisma } from "./lib/prisma";

async function main() {
  const updated = await prisma.staffProfile.update({
    where: { id: "cmscwz30m000104jsdzappinj" },
    data: { userId: "cmscx24fi000204jstx74kex9" },
  });
  console.log("Linked:", updated);
}

main().finally(() => process.exit(0));
