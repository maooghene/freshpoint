import { prisma } from "../lib/prisma";

async function main() {
  const item = await prisma.item.findUnique({
    where: { id: "cmrze2v0d000a04l5yt4yilno" },
    include: { business: { include: { schedules: true, staff: true } } },
  });

  console.log("Business timezone:", item?.business?.timezone);
  console.log("Business bufferTimeMinutes:", item?.business?.bufferTimeMinutes);
  console.log("Staff count:", item?.business?.staff?.length);
  console.log("Schedules:", JSON.stringify(item?.business?.schedules, null, 2));

  await prisma.$disconnect();
}

main();
