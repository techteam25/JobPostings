"use client";

import { useState } from "react";

import { MapPin, Search } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SearchInputMobile = () => {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="w-full lg:hidden" asChild>
        <Button className="flex-1 bg-transparent shadow-none">
          <Search className="text-muted-foreground mr-1" />
          <span className="text-muted-foreground flex-1 text-left">
            Find your next role
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90%]">
        <DrawerHeader>
          <DrawerTitle>Search Jobs</DrawerTitle>
          <DrawerDescription className="sr-only">Search Jobs</DrawerDescription>
        </DrawerHeader>
        <div className="bg-muted-foreground/80 mb-4 h-px w-full" />
        <div className="flex flex-col space-y-2">
          <div className="border-input bg-input relative mx-2 flex items-center justify-start rounded-full px-4">
            <Search className="text-muted-foreground size-5" />
            <Input
              placeholder="Find your next role"
              className="text-muted-foreground h-12 flex-1 text-base shadow-none outline-none focus-visible:ring-0"
            />
          </div>
          <div className="border-input bg-input relative mx-2 flex items-center justify-start rounded-full px-4">
            <MapPin className="text-muted-foreground size-5" />
            <Input
              placeholder="Location"
              className="text-muted-foreground h-12 flex-1 text-base shadow-none outline-none focus-visible:ring-0"
            />
          </div>
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
