"use client"; // Required for dynamic multi-tenant workspace routing hooks

import { useParams } from "next/navigation";
import { useAuth, SignIn } from "@clerk/nextjs";
import BusinessLayout from "@/components/business/BusinessLayout";
import Loading from "@/components/Loading";

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function BusinessTenantLayout({ children }: TenantLayoutProps) {
  const params = useParams();
  const { isLoaded, isSignedIn } = useAuth();

  // Captures the current business tenant slug from the URL parameters
  // e.g., 'boyzltd', 'powergym', or 'freshpoint-hq'
  const businessSlug = params?.slug as string;

  // Fallback path securely redirects back inside the tenant's exact URL state context
  const redirectUrl = businessSlug ? `/business/${businessSlug}` : "/business";

  // Prevent screen flashes or rendering issues while Clerk verifies the session state
  if (!isLoaded) {
    return <Loading />;
  }

  // 1. Renders ONLY when signed in
  if (isSignedIn) {
    return (
      <BusinessLayout businessSlug={businessSlug}>{children}</BusinessLayout>
    );
  }

  // 2. Renders ONLY when signed out
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignIn fallbackRedirectUrl={redirectUrl} routing="hash" />
    </div>
  );
}
