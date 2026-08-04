import { prisma } from "./lib/prisma";

async function main() {
  const staffProfile = await prisma.staffProfile.findFirst({
    where: { email: "maooghenem+test3@gmail.com" },
  });
  console.log("StaffProfile:", staffProfile);

  const user = await prisma.user.findUnique({
    where: { email: "maooghenem+test3@gmail.com" },
  });
  console.log("User:", user);

  console.log("MATCH?", staffProfile?.userId === user?.id);
}

main().finally(() => process.exit(0));
