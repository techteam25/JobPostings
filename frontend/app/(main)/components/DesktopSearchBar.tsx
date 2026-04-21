"use client";

import { type KeyboardEvent, memo, useCallback, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";

import { ClearableInput } from "@/components/ui/clearable-input";
import { LocationCombobox } from "@/components/ui/location-combobox";
import { useFiltersStore } from "@/context/store";

interface DesktopSearchBarProps {
  onSearchCommitted?: () => void;
}

export const DesktopSearchBar = memo(function DesktopSearchBar({
  onSearchCommitted,
}: DesktopSearchBarProps) {
  const zustandKeyword = useFiltersStore((state) => state.keyword);
  const zustandLocation = useFiltersStore((state) => state.location);
  const setKeyword = useFiltersStore((state) => state.setKeyword);
  const setLocation = useFiltersStore((state) => state.setLocation);

  // Pending buffer pattern: while the user is editing, their draft lives in
  // these sentinels. A `null` pending value means "show the Zustand value",
  // so hydration/mobile updates flow into the input automatically without
  // needing a useEffect to mirror state.
  const [pendingKeyword, setPendingKeyword] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);

  const displayKeyword = pendingKeyword ?? zustandKeyword;
  const displayLocation = pendingLocation ?? zustandLocation;

  const keywordRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(() => {
    const trimmedKeyword = displayKeyword.trim();
    setKeyword(trimmedKeyword);
    // Clearing the keyword means "exit search" — also clear location
    // so buildApiParams returns {} and isSearching becomes false.
    setLocation(trimmedKeyword ? displayLocation : "");
    setPendingKeyword(null);
    setPendingLocation(null);
    onSearchCommitted?.();
  }, [
    displayKeyword,
    displayLocation,
    setKeyword,
    setLocation,
    onSearchCommitted,
  ]);

  const handleKeywordKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      // When keyword is empty, commit immediately to exit search mode.
      // Don't require the user to fill in location to "undo" a search.
      if (!displayKeyword.trim()) {
        commit();
        return;
      }
      if (!displayLocation.trim()) {
        locationRef.current?.focus();
        return;
      }
      commit();
    },
    [commit, displayKeyword, displayLocation],
  );

  const handleLocationKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commit();
    },
    [commit],
  );

  const inputClassName =
    "text-secondary-foreground border-foreground bg-background h-12 rounded-none text-lg shadow-none outline-none focus-visible:ring-0";

  return (
    <>
      <ClearableInput
        ref={keywordRef}
        value={displayKeyword}
        onChange={(event) => setPendingKeyword(event.target.value)}
        onClear={() => setPendingKeyword("")}
        onKeyDown={handleKeywordKeyDown}
        placeholder="Find your next job"
        aria-label="Search for jobs"
        clearAriaLabel="Clear search"
        startAdornment={<Search className="size-6" />}
        containerClassName="flex-1"
        className={`${inputClassName} rounded-l-full`}
      />
      <LocationCombobox
        ref={locationRef}
        value={displayLocation}
        onChange={(value) => setPendingLocation(value)}
        onKeyDown={handleLocationKeyDown}
        placeholder='City, state, zip code, or "remote"'
        aria-label="Search by location"
        clearAriaLabel="Clear location"
        startAdornment={<MapPin className="size-5" />}
        containerClassName="w-72"
        className={`${inputClassName} rounded-r-full`}
      />
    </>
  );
});
DesktopSearchBar.displayName = "DesktopSearchBar";
