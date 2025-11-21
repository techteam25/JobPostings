"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { type SortBy } from "@/context/store";

import { BsChevronDown } from "react-icons/bs";
import { useFiltersStore } from "@/context/store";

const sortOptions = {
  recent: "Most Recent",
  relevant: "Most Relevant",
};
export const SortByDropDownButton = () => {
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
          {sortOptions[sortBy]}
          <BsChevronDown className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sortBy}
          onValueChange={(val) => setSortBy(val as SortBy)}
        >
          <DropdownMenuRadioItem value="recent">
            Most Recent
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="relevant">
            Most Relevant
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
