import { ReactNode } from "react";
import { cn } from "@/lib/utils";

import type { Metadata } from "next";

import { Montserrat, Poppins } from "next/font/google";

import Providers from "@/providers";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-poppins",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    template: "%s | getINvolved",
    absolute: "getINvolved - Helping Missions Find Talent",
  },
  description: "getINvolved - Connecting Missions with Passionate Volunteers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={cn(
          poppins.className,
          montserrat.className,
          "bg-background min-h-screen",
        )}
      >
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
