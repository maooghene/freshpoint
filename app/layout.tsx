// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import Providers from "@/components/Providers";
import ToastProvider from "@/components/ToastProvider";
import { ImpersonationStickyBanner } from "@/components/admin/ImpersonationStickyBanner";

export const metadata: Metadata = {
  title: "FreshPoint | Wellness Platform",
  description:
    "Multi-tenant workspace Admin Staff for modern wellness businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={{
        signIn: {
          start: {
            title: "Sign in to FreshPoint",
            subtitle: "to continue to your wellness workspace",
          },
        },
        signUp: {
          start: {
            title: "Create your FreshPoint account",
            subtitle: "get started with our marketplace platform",
          },
        },
        // 🚀 FIXED: Replaced userAccountManager with the correct type-safe key path
        organizationList: {
          title: "Choose an account to continue to FreshPoint",
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className="scroll-smooth antialiased h-full"
      >
        <body className="font-sans bg-background text-foreground flex flex-col min-h-screen h-full">
          <Providers>
            {/* 🌟 FIXED: Created a locked parent node layout stretching from header to baseline layout elements */}
            <div className="flex flex-col min-h-screen w-full relative">
              {/* 🌟 IMPERSONATION INJECTION: Drops at the top layer, pushing the frame down cleanly if active */}
              <ImpersonationStickyBanner />

              {/* 🌟 FIXED: main flex-grow pushes any element beneath it (like the footer) down, even during loading states */}
              <main className="flex-grow flex flex-col w-full relative">
                {children}
              </main>
            </div>

            <ToastProvider />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
