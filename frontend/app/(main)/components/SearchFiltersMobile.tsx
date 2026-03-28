"use client";

import { useState } from "react";

import { SlidersHorizontal, X } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FilterOptionsContent } from "@/app/(main)/components/FilterOptionsContent";

export const SearchFiltersMobile = () => {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="w-full lg:hidden" asChild>
        <Button className="w-auto justify-end bg-transparent shadow-none hover:bg-transparent">
          <SlidersHorizontal className="text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle>Filter Jobs</DrawerTitle>
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
          <DrawerDescription className="sr-only">Filter Jobs</DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <FilterOptionsContent />
        </div>

        <div className="flex flex-col gap-2 px-4 pt-4 pb-6">
          <Button className="bg-foreground hover:bg-foreground/90 h-12 w-full rounded-full text-base">
            Apply Filters
          </Button>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground h-10 text-sm"
            >
              Clear All
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
