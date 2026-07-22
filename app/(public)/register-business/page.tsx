import * as React from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { RegisterBusinessForm } from "./RegisterBusinessForm";
import { RedirectFeedback } from "./RedirectFeedback";
import { getBusinessCategories } from "@/lib/actions/admin-categories"; // ADDED

export default async function RegisterBusinessPage(): Promise<React.JSX.Element> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/register-business");
  }

  const clerkUser = await currentUser();
  const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || "";
  const cleanEmail = primaryEmail.toLowerCase().trim();

  if (!cleanEmail) {
    redirect("/");
  }

  let systemUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true, email: true },
  });

  if (!systemUser) {
    try {
      systemUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: cleanEmail,
          firstName: clerkUser?.firstName || "Valued",
          lastName: clerkUser?.lastName || "Guest",
          role: "CUSTOMER",
        },
        select: { id: true, email: true },
      });
    } catch (createCollision: unknown) {
      systemUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true, email: true },
      });
    }
  } else {
    await prisma.user.update({
      where: { id: systemUser.id },
      data: {
        clerkId: userId,
        firstName: clerkUser?.firstName || "Valued",
        lastName: clerkUser?.lastName || "Guest",
      },
    });
  }

  if (!systemUser) {
    redirect("/");
  }

  let existingBusiness = await prisma.business.findFirst({
    where: { ownerId: systemUser.id },
    select: { slug: true },
  });

  if (!existingBusiness) {
    const orphanedBusiness = await prisma.business.findFirst({
      where: { email: cleanEmail },
    });

    if (orphanedBusiness) {
      const updatedBusiness = await prisma.business.update({
        where: { id: orphanedBusiness.id },
        data: { ownerId: systemUser.id },
        select: { slug: true },
      });
      existingBusiness = updatedBusiness;
    }
  }

  if (existingBusiness && existingBusiness.slug) {
    return <RedirectFeedback slug={existingBusiness.slug} />;
  }

  // ADDED: pull live, active categories set by admin
  const businessCategories = await getBusinessCategories();
  const activeCategories = businessCategories
    .filter((c) => c.isActive)
    .map((c) => ({ label: c.label, value: c.value }));

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 w-full transition-colors duration-200">
      <RegisterBusinessForm categories={activeCategories} />
    </main>
  );
}
