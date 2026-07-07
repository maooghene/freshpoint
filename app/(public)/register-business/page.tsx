// app/register-business/page.tsx
import * as React from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { RegisterBusinessForm } from "./RegisterBusinessForm"; // Your existing form component
import { RedirectFeedback } from "./RedirectFeedback"; // Clean React 19 Client redirect feedback component

export default async function RegisterBusinessPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/register-business");
  }

  // 1. Locate the internal database system user row index
  const systemUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!systemUser) {
    redirect("/dashboard");
  }

  // 2. Query to see if this user already owns an active workspace storefront model
  const existingBusiness = await prisma.business.findFirst({
    where: { ownerId: systemUser.id },
    select: { slug: true },
  });

  // 3. THE FIX: If they already own a shop, prevent duplicate creation and route to /business/[slug]
  if (existingBusiness) {
    return <RedirectFeedback slug={existingBusiness.slug} />;
  }

  // 4. Otherwise, render your normal workspace creation registration fields
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <RegisterBusinessForm />
    </main>
  );
}
