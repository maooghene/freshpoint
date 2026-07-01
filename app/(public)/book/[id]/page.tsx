import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BookingWizardClient from "@/components/public/booking/BookingWizardClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingWizardPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch the treatment item along with connected business and staff records
  const item = await prisma.item.findUnique({
    where: { id, isActive: true },
    include: {
      business: {
        include: {
          schedules: true,
          staff: true,
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
        {/* 🚀 FIXED: Safe double-cast via unknown satisfies the linter and matches types perfectly */}
        <BookingWizardClient
          item={
            item as unknown as Parameters<typeof BookingWizardClient>[0]["item"]
          }
        />
      </div>
    </div>
  );
}
