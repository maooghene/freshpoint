import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BookingWizardClient from "@/components/public/booking/BookingWizardClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingWizardPage({ params }: PageProps) {
  const { id } = await params;

  const item = await prisma.item.findFirst({
    where: { id, isActive: true },
    include: {
      business: {
        include: {
          schedules: true,
          staff: {
            where: { isActive: true },
            include: {
              schedules: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  return (
    <div className="relative min-h-screen pt-12 bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 w-full">
        <BookingWizardClient
          item={
            item as unknown as Parameters<typeof BookingWizardClient>[0]["item"]
          }
        />
      </div>
    </div>
  );
}
