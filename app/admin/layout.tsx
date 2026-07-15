// app/admin/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin";
import AdminShell from "./AdminShell";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, isPlatformStaff } = await verifyAdminSession();

  if (!isAdmin && !isPlatformStaff) {
    redirect("/admin/errors/unauthorized");
  }

  return <AdminShell>{children}</AdminShell>;
}
