// app/admin/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin";
import AdminShell from "./AdminShell";
import { prisma } from "@/lib/prisma";
import { AnnouncementsDisplay } from "@/components/announcements/AnnouncementsDisplay";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, isPlatformStaff } = await verifyAdminSession();

  if (!isAdmin && !isPlatformStaff) {
    redirect("/admin/errors/unauthorized");
  }

  // Complaints still waiting for attention (anything not yet resolved).
  const openComplaintCount = await prisma.complaint.count({
    where: { status: { not: "RESOLVED" } },
  });

  return (
    <AdminShell openComplaintCount={openComplaintCount}>
      <AnnouncementsDisplay />
      {children}
    </AdminShell>
  );
}
