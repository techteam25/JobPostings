"use client";

import { memo } from "react";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DatePosted, useFiltersStore } from "@/context/store";

export const DatePostedDropDownButton = memo(
  function DatePostedDropDownButton() {
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
            <ChevronDown className="ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" side="bottom">
          <DropdownMenuGroup className="flex flex-col space-y-2">
            <DropdownMenuRadioGroup
              value={datePosted || ""}
              onValueChange={(value) =>
                setDatePosted(value === "" ? null : (value as DatePosted))
              }
            >
              <DropdownMenuRadioItem
                value=""
                className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
              >
                Any Time
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="last-24-hours"
                className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
              >
                Last 24 hours
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="last-7-days"
                className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
              >
                Last 7 days
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="last-14-days"
                className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
              >
                Last 14 days
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
DatePostedDropDownButton.displayName = "DatePostedDropDownButton";
