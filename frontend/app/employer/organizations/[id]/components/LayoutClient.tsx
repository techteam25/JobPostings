"use client";

import { ReactNode, useState } from "react";
import { AppSidebar } from "./dashboard-sidebar";
import { EmployerNavbar } from "./employer-navbar";
import { FeatureErrorBoundary } from "@/components/common/FeatureErrorBoundary";
import { OrganizationProvider } from "../context/organization-context";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { OrganizationWithMembers } from "@/lib/types";

interface LayoutClientProps {
  children: ReactNode;
  organization: OrganizationWithMembers;
  currentUserId: number;
}

export function LayoutClient({
  children,
  organization,
  currentUserId,
}: LayoutClientProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const handleToggleSidebar = () => {
    // On mobile, toggle the sheet; on desktop, toggle the aside
    if (window.innerWidth < 768) {
      setIsMobileSheetOpen(!isMobileSheetOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <OrganizationProvider
      organization={organization}
      currentUserId={currentUserId}
    >
      <div className="flex h-screen w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "bg-background hidden border-r transition-all duration-300 ease-in-out md:block",
            isOpen ? "w-64" : "w-0 overflow-hidden",
          )}
        >
          <FeatureErrorBoundary featureName="navigation sidebar">
            <AppSidebar />
          </FeatureErrorBoundary>
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="left" className="w-64 p-0 md:hidden">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AppSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <EmployerNavbar onToggleSidebar={handleToggleSidebar} />
          <div className="flex-1 overflow-y-auto p-4">
            <FeatureErrorBoundary featureName="organization dashboard">
              {children}
            </FeatureErrorBoundary>
          </div>
        </main>
      </div>
    </OrganizationProvider>
  );
}
