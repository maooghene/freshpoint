import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers"; // This already handles Redux + Theme internally

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
        className="scroll-smooth antialiased"
      >
        <body className="min-h-screen font-sans bg-background text-foreground flex flex-col">
          {/* Centralized application provider layer */}
          <Providers>
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
