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
import { Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BsFillPersonFill } from "react-icons/bs";
import { useUserSignOut } from "@/app/(main)/hooks/use-user-signout";

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

  return (
    <Sheet>
      <SheetTrigger className="items-center lg:hidden" asChild>
        <Button variant="outline">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {profileImage ? (
              <div className="relative h-10 w-10">
                <Image
                  src={profileImage!}
                  alt="User Profile Image"
                  fill
                  className="mr-2 rounded-full object-cover"
                />
                {username}
              </div>
            ) : (
              <div className="bg-background flex items-center rounded-full">
                <BsFillPersonFill className="mr-2" />
                {username}
              </div>
            )}
          </SheetTitle>
          <SheetDescription>{email}</SheetDescription>
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
      </SheetContent>
    </Sheet>
  );
}
