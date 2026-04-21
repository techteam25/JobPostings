"use client";

import { type KeyboardEvent, useCallback, useRef, useState } from "react";

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
import { ClearableInput } from "@/components/ui/clearable-input";
import { LocationCombobox } from "@/components/ui/location-combobox";
import { Button } from "@/components/ui/button";
import { useFiltersStore } from "@/context/store";

interface SearchInputMobileProps {
  onSearchCommitted?: () => void;
}

export const SearchInputMobile = ({
  onSearchCommitted,
}: SearchInputMobileProps) => {
  const setKeyword = useFiltersStore((state) => state.setKeyword);
  const setLocation = useFiltersStore((state) => state.setLocation);

  const [open, setOpen] = useState(false);
  const [localKeyword, setLocalKeyword] = useState("");
  const [localLocation, setLocalLocation] = useState("");

  const keywordInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Pull the latest committed search off the store so the drawer reflects
      // whatever the user typed into the desktop bar or previously searched.
      const { keyword, location } = useFiltersStore.getState();
      setLocalKeyword(keyword);
      setLocalLocation(location);
      setTimeout(() => keywordInputRef.current?.focus(), 100);
    }
    setOpen(isOpen);
  }, []);

  const handleCommit = useCallback(() => {
    setKeyword(localKeyword);
    setLocation(localLocation);
    setOpen(false);
    onSearchCommitted?.();
  }, [localKeyword, localLocation, setKeyword, setLocation, onSearchCommitted]);

  const handleKeywordKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      locationInputRef.current?.focus();
    },
    [],
  );

  const handleLocationKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      handleCommit();
    },
    [handleCommit],
  );

  const pillInputClass =
    "text-muted-foreground h-12 flex-1 text-base shadow-none outline-none focus-visible:ring-0 border-0 bg-transparent";

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
          <ClearableInput
            ref={keywordInputRef}
            value={localKeyword}
            onChange={(event) => setLocalKeyword(event.target.value)}
            onClear={() => setLocalKeyword("")}
            onKeyDown={handleKeywordKeyDown}
            placeholder="Find your next role"
            aria-label="Search for jobs"
            clearAriaLabel="Clear search"
            startAdornment={<Search className="size-5" />}
            containerClassName="border-input bg-input rounded-full"
            className={pillInputClass}
          />
          <LocationCombobox
            ref={locationInputRef}
            value={localLocation}
            onChange={(value) => setLocalLocation(value)}
            onKeyDown={handleLocationKeyDown}
            placeholder='City, state, zip code, or "remote"'
            aria-label="Search by location"
            clearAriaLabel="Clear location"
            startAdornment={<MapPin className="size-5" />}
            containerClassName="border-input bg-input rounded-full"
            className={pillInputClass}
          />

          <Button
            onClick={handleCommit}
            className="bg-foreground hover:bg-foreground/90 mt-1 h-12 w-full rounded-full text-base"
          >
            Search
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
