"use client";

import { useState } from "react";

import { BsSliders } from "react-icons/bs";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
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
        <Button className="w-auto justify-end bg-transparent shadow-none">
          <BsSliders className="text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90%]">
        <DrawerHeader>
          <DrawerTitle>Filter Jobs</DrawerTitle>
          <DrawerDescription className="sr-only">Filter Jobs</DrawerDescription>
        </DrawerHeader>
        <div className="bg-muted-foreground/80 mb-4 h-px w-full" />
        <div className="px-4">
          <FilterOptionsContent />
        </div>
        <DrawerFooter>
          <Button className="bg-foreground hover:bg-foreground/90">
            Search
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Clear</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
