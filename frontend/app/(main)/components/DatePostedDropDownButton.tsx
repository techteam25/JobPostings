"use client";

import { BsChevronDown } from "react-icons/bs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DatePosted, useFiltersStore } from "../../../context/store";

export const DatePostedDropDownButton = () => {
  const datePosted = useFiltersStore((state) => state.datePosted);
  const setDatePosted = useFiltersStore((state) => state.setDatePosted);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-input bg-secondary data-[state=open]:bg-input rounded-full border-none px-3 py-4 shadow-none focus:bg-transparent focus-visible:ring-0"
        asChild
      >
        <Button
          variant="outline"
          className="hover:text-foreground cursor-pointer hover:bg-transparent"
        >
          Date Posted
          <BsChevronDown className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup
          value={datePosted || ""}
          onValueChange={(value) =>
            setDatePosted(value === "" ? null : (value as DatePosted))
          }
        >
          <DropdownMenuRadioItem value="">Any Time</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="last-24-hours">
            Last 24 hours
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="last-7-days">
            Last 7 days
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="last-14-days">
            Last 14 days
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
