import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";


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
          <Providers>
            <div className="flex-1 flex flex-col">
              {/* Core Global Header Navigation */}
              <Navbar />
              {children}
              
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
