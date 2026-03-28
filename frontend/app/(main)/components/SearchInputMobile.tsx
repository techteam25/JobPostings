"use client";

import { useCallback, useRef, useState } from "react";

import { MapPin, Search, X } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SearchInputMobile = () => {
  const [open, setOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, []);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger className="w-full lg:hidden" asChild>
        <Button className="flex-1 bg-transparent shadow-none hover:bg-transparent">
          <Search className="text-muted-foreground mr-1" />
          <span className="text-muted-foreground flex-1 text-left">
            Find your next role
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle>Search Jobs</DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-8 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">Search Jobs</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-3 px-4 pb-6">
          <div className="border-input bg-input relative flex items-center rounded-full px-4">
            <Search className="text-muted-foreground size-5 shrink-0" />
            <Input
              ref={searchInputRef}
              placeholder="Find your next role"
              className="text-muted-foreground h-12 flex-1 text-base shadow-none outline-none focus-visible:ring-0"
            />
          </div>
          <div className="border-input bg-input relative flex items-center rounded-full px-4">
            <MapPin className="text-muted-foreground size-5 shrink-0" />
            <Input
              placeholder="Location"
              className="text-muted-foreground h-12 flex-1 text-base shadow-none outline-none focus-visible:ring-0"
            />
          </div>

          <Button className="bg-foreground hover:bg-foreground/90 mt-1 h-12 w-full rounded-full text-base">
            Search
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
