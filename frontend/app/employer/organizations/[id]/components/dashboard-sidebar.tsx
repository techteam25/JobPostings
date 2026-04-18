"use client";

import {
  BarChart3,
  Calendar,
  HelpCircle,
  Home,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOrganization } from "../context/organization-context";
import { OrgSwitcher } from "./org-switcher";

export function AppSidebar() {
  const pathname = usePathname();
  const { organization } = useOrganization();

  const basePath = `/employer/organizations/${organization.id}`;

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
      {/* Org Switcher Header */}
      <OrgSwitcher />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <Link href={basePath} className={linkClass(basePath)}>
          <Home />
          <span>Home</span>
        </Link>

        <Link
          href={`${basePath}/applications`}
          className={linkClass(`${basePath}/applications`)}
        >
          <BarChart3 />
          <span>Applications</span>
        </Link>

        <Link
          href={`${basePath}/jobs`}
          className={linkClass(`${basePath}/jobs`)}
        >
          <Calendar />
          <span>Jobs</span>
        </Link>

        <Link
          href="/employer/candidates"
          className={linkClass("/employer/candidates")}
        >
          <Users />
          <span>Candidates</span>
        </Link>

        <Link
          href={`${basePath}/settings`}
          className={linkClass(`${basePath}/settings`)}
        >
          <Settings />
          <span>Settings</span>
        </Link>

        <span className="text-muted-foreground flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2">
          <HelpCircle />
          <span>Help</span>
        </span>

        <span className="text-muted-foreground flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2">
          <MessageSquare />
          <span>Feedback</span>
        </span>
      </nav>
    </div>
  );
}
