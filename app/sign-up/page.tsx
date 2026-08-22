// app/sign-up/page.tsx
import * as React from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage(): React.JSX.Element {
  return (
    <div className="w-full min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <SignUp routing="hash" fallbackRedirectUrl="/" signInUrl="/sign-in" />
    </div>
  );
}
