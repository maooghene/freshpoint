// app/admin/errors/unauthorized/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-destructive">
          403 - Restricted Access
        </h1>
        <p className="text-muted-foreground">
          Your credentials do not grant you permissions to modify platform
          configuration parameters or access global management portals.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/">Return to Storefront</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
