import { ReactNode } from "react";
import { cn } from "@/lib/utils";

import type { Metadata } from "next";

import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
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
      <body className={cn(poppins.className, "bg-slate-300")}>
        <div className="max-w-7xl mx-auto">{children}</div>
      </body>
    </html>
  );
}
