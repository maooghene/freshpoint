// src/components/Providers.tsx
"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
      </ThemeProvider>
    </Provider>
  );
}
