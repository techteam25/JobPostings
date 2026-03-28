"use client";

import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { type SortBy } from "@/context/store";

import { ChevronDown } from "lucide-react";
import { useFiltersStore } from "@/context/store";

const sortOptions = {
  recent: "Most Recent",
  relevant: "Most Relevant",
};
export const SortByDropDownButton = memo(function SortByDropDownButton() {
  const sortBy = useFiltersStore((state) => state.sortBy);
  const setSortBy = useFiltersStore((state) => state.setSortBy);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hidden shadow-none focus:bg-transparent data-[state=open]:bg-transparent lg:block"
        asChild
      >
        <Button
          variant="outline"
          className="hover:text-foreground cursor-pointer hover:bg-transparent"
        >
          <span>
            {sortOptions[sortBy]}
            <ChevronDown className="ml-1 inline-flex" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side="bottom">
        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="flex flex-col space-y-2">
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(val) => setSortBy(val as SortBy)}
          >
            <DropdownMenuRadioItem
              value="recent"
              className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
            >
              Most Recent
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="relevant"
              className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
            >
              Most Relevant
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
SortByDropDownButton.displayName = "SortByDropDownButton";
