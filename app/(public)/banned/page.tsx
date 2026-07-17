// app/banned/page.tsx
import { ShieldOff } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
          <ShieldOff className="h-7 w-7 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Account Suspended
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your access to FreshPoint has been restricted. If you believe this
            is a mistake, please reach out to our support team for assistance.
          </p>
        </div>

        <SignOutButton redirectUrl="/">
          <button className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
