"use client";

import { BsSliders } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterOptionsContent } from "@/app/(main)/components/FilterOptionsContent";

export const SearchFilterDropDownButton = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-input bg-secondary data-[state=open]:bg-input rounded-full border-none px-3 py-4 shadow-none focus:bg-transparent focus-visible:ring-0"
        asChild
      >
        <Button variant="outline" size="icon">
          <BsSliders className="mr-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="my-4 w-auto p-4">
        <div className="w-72">
          <FilterOptionsContent />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
