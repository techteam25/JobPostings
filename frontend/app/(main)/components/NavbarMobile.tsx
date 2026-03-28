"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CircleUser,
  LogIn,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSignOut } from "@/app/(main)/hooks/use-user-signout";
import { Separator } from "@/components/ui/separator";
import { useAuthenticationStatus } from "@/hooks/use-authentication-status";

interface NavbarMobileProps {
  username?: string;
  email?: string;
  profileImage?: string | null;
}

export function NavbarMobile({
  username,
  profileImage,
  email,
}: NavbarMobileProps) {
  const { signOutAsyncAction, isPending } = useUserSignOut();
  const { isAuthenticated } = useAuthenticationStatus();
  const { theme, setTheme } = useTheme();

  return (
    <Sheet>
      <SheetTrigger className="items-center" asChild>
        <Button variant="outline" className="border-0 shadow-none">
          <Menu className="text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        {isAuthenticated ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    src={profileImage ?? undefined}
                    alt={username ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {username ? (
                      username
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
                <div className="flex flex-col items-start">
                  <SheetTitle className="text-sm font-medium">
                    {username}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {email}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <nav className="flex flex-col items-start gap-4 p-4">
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
              >
                Saved Jobs
              </Button>
              <Button
                variant="link"
                className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
              >
                Applications
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

              <Separator className="my-1" />

              <SheetClose asChild>
                <Button
                  variant="link"
                  className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
                  asChild
                >
                  <Link href="/me/profile">
                    <CircleUser className="size-4" />
                    Profile
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant="link"
                  className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
                  asChild
                >
                  <Link href="/settings">
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </Button>
              </SheetClose>

              <Separator className="my-1" />

              <Button
                variant="link"
                className="text-secondary-foreground cursor-pointer rounded-2xl px-6 py-2 text-xs transition md:text-sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                Theme
              </Button>
            </nav>
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  className="bg-foreground"
                  onClick={() => signOutAsyncAction()}
                  disabled={isPending}
                >
                  {isPending ? "Signing Out..." : "Sign Out"}
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle></SheetTitle>
            </SheetHeader>
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  variant="link"
                  className="text-foreground cursor-pointer focus-visible:ring-0"
                >
                  <Link href="/sign-in" className="flex items-center">
                    <LogIn className="text-foreground mr-2" />
                    Sign in
                  </Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
