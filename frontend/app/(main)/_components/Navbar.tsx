"use client";

import Image from "next/image";

import { Bell, Loader2 } from "lucide-react";
import { BsFillPersonFill } from "react-icons/bs";
import { TbLogout } from "react-icons/tb";

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

  return (
    <div className="mb-6 w-full py-4">
      <div className="flex w-full items-center justify-between">
        {/* Left Section - Logo and Links */}
        <div className="flex items-center gap-4">
          <Image
            src={GetInvolvedLogo}
            alt="Get Involved Logo"
            className="h-14 w-auto"
          />

          <nav className="flex items-center gap-1">
            <Button
              variant="link"
              className="text-secondary-foreground rounded-2xl px-6 py-2 text-xs transition md:text-sm"
            >
              Explore Job
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
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
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
                    />
                  </div>
                ) : (
                  <div className="bg-background flex items-center justify-center rounded-full">
                    <BsFillPersonFill className="" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuItem className="">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{data?.data?.user.name}</p>
                  <p className="text-muted-foreground">
                    {data?.data?.user.email}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="hover:bg-muted/80">
                <Button
                  variant="link"
                  className="text-foreground cursor-pointer focus-visible:ring-0"
                  onClick={async () => await signOutAsyncAction()}
                >
                  {signOutPending ? (
                    <span>
                      <Loader2 className="text-muted-foreground animate-spin" />{" "}
                      Signing out...
                    </span>
                  ) : (
                    <span>Sign out</span>
                  )}
                  <TbLogout />
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
