"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Bell,
  ChevronDown,
  CircleUser,
  Loader2,
  LogIn,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import { useUserSession } from "@/app/(main)/hooks/use-user-session";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import GetInvolvedLogo from "@/public/GetInvolved_Logo.png";

import { Skeleton } from "@/components/ui/skeleton";
import { useUserSignOut } from "@/app/(main)/hooks/use-user-signout";
import { NavbarMobile } from "@/app/(main)/components/NavbarMobile";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuthenticationStatus } from "@/hooks/use-authentication-status";
export function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

export default function Navbar() {
  const { isPending, data } = useUserSession();
  const { isAuthenticated } = useAuthenticationStatus();
  const { signOutAsyncAction, isPending: signOutPending } = useUserSignOut();

  const handleSignOut = useCallback(async () => {
    await signOutAsyncAction();
  }, [signOutAsyncAction]);

  return (
    <header className="mb-6 border-b py-4">
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Left Section - Logo and Links */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Image
              src={GetInvolvedLogo}
              alt="Get Involved Logo"
              className="h-10 w-auto md:h-12 lg:h-14"
              priority
            />

            <nav className="hidden items-center gap-1 lg:flex">
              <Button
                variant="link"
                className="text-secondary-foreground rounded-2xl px-6 py-2 text-xs transition md:text-sm"
                asChild
              >
                <Link href="/">Explore Jobs</Link>
              </Button>
              <Button
                variant="link"
                className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
                asChild
              >
                <Link href="/saved">Saved Jobs</Link>
              </Button>
              <Button
                variant="link"
                className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
                asChild
              >
                <Link href="/applications">My Applications</Link>
              </Button>
              <Button
                variant="link"
                className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
              >
                Messages
              </Button>
              <Button
                variant="link"
                className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
              >
                FAQ
              </Button>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Notification Bell - visible on mobile */}
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-secondary rounded-full p-2 transition"
            >
              <Bell className="text-secondary-foreground size-5" />
            </Button>
            <NavbarMobile
              username={data?.data?.user.name}
              email={data?.data?.user.email}
              profileImage={data?.data?.user.image}
            />
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            {/* Notification Bell */}
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-secondary rounded-full p-2 transition"
            >
              <Bell className="text-secondary-foreground h-6 w-6" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full p-1 pr-3"
                >
                  {isPending ? (
                    <SkeletonDemo />
                  ) : (
                    <>
                      <Avatar className="size-9">
                        <AvatarImage
                          src={data?.data?.user.image ?? undefined}
                          alt={data?.data?.user.name ?? "User"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {data?.data?.user.name ? (
                            data.data.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          ) : (
                            <User className="size-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="text-muted-foreground size-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
                {isAuthenticated ? (
                  <>
                    <DropdownMenuLabel className="flex items-center gap-3 p-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={data?.data?.user.image ?? undefined}
                          alt={data?.data?.user.name ?? "User"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {data?.data?.user.name ? (
                            data.data.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          ) : (
                            <User className="size-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm leading-none font-medium">
                          {data?.data?.user.name}
                        </p>
                        <p className="text-muted-foreground text-xs leading-none">
                          {data?.data?.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="hover:bg-secondary cursor-pointer rounded-lg p-2 [&>svg]:size-5"
                      asChild
                    >
                      <Link
                        href="/me/profile"
                        className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-2 font-medium"
                      >
                        <CircleUser className="text-secondary-foreground mr-2 size-5" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-secondary cursor-pointer rounded-lg p-2 [&>svg]:size-5"
                      asChild
                    >
                      <Link
                        href="/settings"
                        className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-2 font-medium"
                      >
                        <Settings className="text-secondary-foreground mr-2 size-5" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={signOutPending}
                      className="hover:bg-secondary cursor-pointer rounded-lg p-2"
                    >
                      {signOutPending ? (
                        <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
                          <Loader2 className="text-secondary-foreground mr-2 size-5 animate-spin" />
                          Signing out...
                        </div>
                      ) : (
                        <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
                          <LogOut className="text-secondary-foreground mr-2 size-5" />
                          Sign out
                        </div>
                      )}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    className="hover:bg-secondary cursor-pointer rounded-lg p-2"
                    asChild
                  >
                    <Link
                      href="/sign-in"
                      className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-2 font-medium"
                    >
                      <LogIn className="text-secondary-foreground mr-2 size-5" />
                      Sign in
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
