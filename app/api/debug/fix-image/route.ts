// Put this inside a temporary scratchpad route like /api/debug/fix-images/route.ts and hit it once in your browser
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const items = await prisma.item.findMany({
    where: { image: { contains: '"' } }, // Target entries with illegal string quotes
  });

  let fixedCount = 0;
  for (const item of items) {
    if (item.image) {
      const safeUrl = item.image.replace(/%22/g, "").replace(/"/g, "");
      await prisma.item.update({
        where: { id: item.id },
        data: { image: safeUrl },
      });
      fixedCount++;
    }
  }

  return NextResponse.json({
    message: `Successfully scrubbed and fixed ${fixedCount} broken database records.`,
  });
}
