"use client";

import { ReactNode, useState } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./dashboard-sidebar";

interface LayoutClientProps {
  children: ReactNode;
  organizationName: string;
  organizationLogoUrl: string | null;
}

export function LayoutClient({
  children,
  organizationName,
  organizationLogoUrl,
}: LayoutClientProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "w-64" : "w-0"
        } border-background bg-background overflow-hidden border-r transition-all duration-300 ease-in-out`}
      >
        <AppSidebar
          organizationName={organizationName}
          organizationLogoUrl={organizationLogoUrl}
        />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </main>
    </div>
  );
}
