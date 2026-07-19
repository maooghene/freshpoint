import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import PersonalSettingsForm from "./PersonalSettingsForm";

export default async function StaffSettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/staff/sign-in");
  }

  // 1. Resolve core registered user profile constraints
  const userProfile = await prisma.user.findUnique({
    where: { clerkId },
    select: { email: true },
  });

  if (!userProfile) {
    notFound();
  }

  // 2. Fetch the staff workspace line element corresponding to this authenticated individual
  const staffProfile = await prisma.staffProfile.findFirst({
    where: {
      email: {
        equals: userProfile.email,
        mode: "insensitive",
      },
    },
    select: {
      name: true,
      role: true,
      email: true,
      isActive: true,
    },
  });

  // Security Guard: Prevent unassigned or inactive entries from bypassing boundaries
  if (!staffProfile || !staffProfile.isActive) {
    redirect("/staff/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
          Workspace Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your independent workforce credentials, communication routes,
          and security visibility presets.
        </p>
      </div>

      <PersonalSettingsForm staff={staffProfile} />
    </div>
  );
}
