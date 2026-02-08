"use client";

import {
  BarChart3,
  Calendar,
  HelpCircle,
  Home,
  MessageSquare,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  organizationId: number;
  organizationName: string;
  organizationLogoUrl: string | null;
}
export function AppSidebar({
  organizationId,
  organizationName,
  organizationLogoUrl,
}: AppSidebarProps) {
  const pathname = usePathname();

  const basePath = `/employer/organizations/${organizationId}`;

  const isActive = (path: string) => {
    if (path === basePath) {
      return pathname === basePath;
    }
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
      isActive(path)
        ? "bg-primary text-primary-foreground"
        : "text-secondary-foreground hover:bg-background",
    );

  return (
    <div className="bg-background flex h-full w-64 flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-4">
        {organizationLogoUrl && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg">
            <img
              src={organizationLogoUrl}
              alt={organizationName}
              className="size-8"
            />
          </div>
        )}
        <span className="flex-wrap text-lg font-bold">{organizationName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <Link href={basePath} className={linkClass(basePath)}>
          <Home size={20} />
          <span>Home</span>
        </Link>

        <Link
          href={`${basePath}/applications`}
          className={linkClass(`${basePath}/applications`)}
        >
          <BarChart3 size={20} />
          <span>Applications</span>
        </Link>

        <Link
          href={`${basePath}/jobs`}
          className={linkClass(`${basePath}/jobs`)}
        >
          <Calendar size={20} />
          <span>Jobs</span>
        </Link>

        <span className="text-muted-foreground flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2">
          <HelpCircle size={20} />
          <span>Help</span>
        </span>

        <span className="text-muted-foreground flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2">
          <MessageSquare size={20} />
          <span>Feedback</span>
        </span>
      </nav>
    </div>
  );
}
