import * as React from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { RegisterBusinessForm } from "./RegisterBusinessForm";
import { RedirectFeedback } from "./RedirectFeedback";

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

  /* 
    🔒 THE FIX: SEQUENTIAL RESILIENT IDENTIFICATION LOOKUP
    Instead of executing concurrent competing upserts that lock database indexes,
    we shift to a read-first isolation check to safely tolerate background processing.
  */
  let systemUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true, email: true },
  });

  // If the user record hasn't been committed yet by either thread, handle creation safely here
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
      // Fallback: If the background tracker inserted the row mid-flight, read it instantly
      systemUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true, email: true },
      });
    }
  } else {
    // Keep internal tracking identifiers safely updated without atomic conflicts
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

  // 1. Look for an existing business owned by this user account ID
  let existingBusiness = await prisma.business.findFirst({
    where: { ownerId: systemUser.id },
    select: { slug: true },
  });

  /* 
    🎯 BACKUP RE-CLAIM TRACKER:
    If no business is found with the internal system ID, look for an orphaned business
    matching this user's validated email address. If found, link it to this account.
  */
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

  // 2. If they have a linked business (found or re-claimed), redirect to their console space
  if (existingBusiness && existingBusiness.slug) {
    return <RedirectFeedback slug={existingBusiness.slug} />;
  }

  // 3. Otherwise, render the blank workspace creation fields cleanly
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 w-full transition-colors duration-200">
      <RegisterBusinessForm />
    </main>
  );
}
