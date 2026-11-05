"use client";

import Link from "next/link";
import { Bell, LogOut, PanelLeft, Settings, Repeat, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useUserSession } from "@/app/(main)/hooks/use-user-session";
import { useUserSignOut } from "@/app/(main)/hooks/use-user-signout";
import { useOrganization } from "../context/organization-context";

interface EmployerNavbarProps {
  onToggleSidebar: () => void;
}

export function EmployerNavbar({ onToggleSidebar }: EmployerNavbarProps) {
  const { organization } = useOrganization();
  const { data: session } = useUserSession();
  const { signOutAsyncAction, isPending } = useUserSignOut();

  const user = session?.data?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary cursor-pointer"
          onClick={onToggleSidebar}
        >
          <PanelLeft />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-muted-foreground text-sm font-medium">
          {organization.name}
        </span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon">
          <Bell />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative size-9 cursor-pointer rounded-full"
            >
              <Avatar className="size-9">
                {user?.image && (
                  <AvatarImage src={user.image} alt={user.name ?? "User"} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm leading-none font-medium">
                  {user?.name ?? "User"}
                </p>
                <p className="text-muted-foreground text-xs leading-none">
                  {user?.email ?? ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/me/profile" className="cursor-pointer">
                  <User data-icon="inline-start" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/employer/organizations/${organization.id}/settings`}
                  className="cursor-pointer"
                >
                  <Settings data-icon="inline-start" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Repeat data-icon="inline-start" />
                  Switch to Candidate View
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={isPending}
              onClick={() => signOutAsyncAction()}
            >
              <LogOut data-icon="inline-start" />
              {isPending ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
