"use client";

import { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { Bell, Loader2 } from "lucide-react";
import { BsFillPersonFill } from "react-icons/bs";
import { AiOutlineProfile } from "react-icons/ai";
import { TbLogout, TbSettings } from "react-icons/tb";

import { useUserSession } from "@/app/(main)/hooks/use-user-session";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import GetInvolvedLogo from "@/public/GetInvolved_Logo.png";

import { Skeleton } from "@/components/ui/skeleton";
import { useUserSignOut } from "@/app/(main)/hooks/use-user-signout";
import { NavbarMobile } from "@/app/(main)/components/NavbarMobile";
export function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

export default function Navbar() {
  const { isPending, data } = useUserSession();
  const { signOutAsyncAction, isPending: signOutPending } = useUserSignOut();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          {isMounted && (
            <>
              <NavbarMobile
                username={data?.data?.user.name}
                email={data?.data?.user.email}
                profileImage={data?.data?.user.image}
              />
              <div className="hidden items-center gap-4 lg:flex">
                {/* Notification Bell */}
                <Button
                  variant="outline"
                  size="icon"
                  className="hover:bg-secondary rounded-full p-2 transition"
                >
                  <Bell className="text-secondary-foreground h-6 w-6" />
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hover:bg-secondary data-[state=open]:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground cursor-pointer rounded-full p-2 transition focus-visible:ring-0 [&_svg]:size-6"
                    >
                      {isPending ? (
                        <SkeletonDemo />
                      ) : data?.data?.user.image ? (
                        <div className="relative h-10 w-10">
                          <Image
                            src={data?.data?.user.image}
                            alt="User Profile Image"
                            fill
                            className="rounded-full object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="bg-background flex items-center justify-center rounded-full">
                          <BsFillPersonFill className="" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="flex w-[300px] flex-col items-start space-y-3"
                  >
                    <DropdownMenuItem className="">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {data?.data?.user.name}
                        </p>
                        <p className="text-muted-foreground">
                          {data?.data?.user.email}
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      asChild
                      className="hover:bg-muted/80 [&>svg]:size-5"
                    >
                      <Link href="/me/profile">
                        <AiOutlineProfile className="text-foreground mr-2 size-8" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="hover:bg-muted/80 [&>svg]:size-5"
                    >
                      <Link href="/settings">
                        <TbSettings className="text-foreground mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="hover:bg-muted/80 [&>svg]:size-5"
                    >
                      <Button
                        variant="link"
                        className="text-foreground cursor-pointer focus-visible:ring-0"
                        onClick={handleSignOut}
                      >
                        <TbLogout className="text-foreground mr-2" />
                        {signOutPending ? (
                          <span>
                            <Loader2 className="text-muted-foreground animate-spin" />{" "}
                            Signing out...
                          </span>
                        ) : (
                          <span>Sign out</span>
                        )}
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
