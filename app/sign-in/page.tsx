// app/sign-in/page.tsx
import * as React from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage(): React.JSX.Element {
  return (
    <div className="w-full min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <SignIn routing="hash" forceRedirectUrl="/" signUpUrl="/sign-up" />
    </div>
  );
}
