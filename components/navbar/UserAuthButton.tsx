"use client";

import * as React from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";

interface UserAuthButtonProps {
  isSignedIn: boolean | undefined;
}

export function UserAuthButton({ isSignedIn }: UserAuthButtonProps) {
  return (
    <div className="hidden md:flex border-l border-border pl-4 h-9 items-center">
      {isSignedIn ? (
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox:
                "w-8 h-8 rounded-xl border border-border shadow-3xs",
            },
          }}
        />
      ) : (
        <SignInButton mode="modal">
          <Button size="sm" className="rounded-xl font-black text-xs shadow-md">
            <LogIn className="w-3.5 h-3.5 mr-1" /> Login
          </Button>
        </SignInButton>
      )}
    </div>
  );
}
