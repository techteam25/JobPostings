"use client";
import { useState } from "react";

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

import { BsChevronDown } from "react-icons/bs";

const sortOptions = {
  recent: "Most Recent",
  relevant: "Most Relevant",
};
export const DropDownSortButton = () => {
  const [sortBy, setSortBy] = useState<"recent" | "relevant">("recent");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="shadow-none focus:bg-transparent data-[state=open]:bg-transparent"
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
          onValueChange={(val) => setSortBy(val as "recent" | "relevant")}
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
