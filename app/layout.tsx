import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Freshpoint | Wellness Platform",
  description:
    "Multi-tenant workspace ecosystem for modern wellness businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className="scroll-smooth antialiased h-full"
      >
        {/* 🌟 FIXED: Added h-full and layout rules to force the HTML body framework to occupy 100% vertical view space */}
        <body className="font-sans bg-background text-foreground flex flex-col min-h-screen h-full">
          <Providers>
            {/* 🌟 FIXED: Created a locked parent node layout stretching from header to baseline layout elements */}
            <div className="flex flex-col min-h-screen w-full relative">
              {/* Core Global Header Navigation */}
              <Navbar />

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
