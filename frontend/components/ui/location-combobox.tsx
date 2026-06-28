"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Loader2, MapPin } from "lucide-react";

import { ClearableInput } from "@/components/ui/clearable-input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { GeocodeResult, GeocodeSuggestion } from "@/lib/geocode";
import { cn } from "@/lib/utils";

export type { GeocodeResult } from "@/lib/geocode";

const CURRENT_LOCATION_STORAGE_KEY = "geocode:current-location";

/**
 * Meta emitted alongside the display value when a user picks a suggestion.
 * `filterValue` is the canonical, backend-matchable form (e.g.
 * "Austin, Texas, United States") — callers that filter against the
 * candidate-search index should persist this in their store, not `label`.
 * When the user types free-form and doesn't pick a suggestion, the combobox
 * fires `onChange` with no meta; callers should fall back to the raw input
 * for both display and filter in that case.
 */
export interface LocationSelection {
  label: string;
  filterValue: string;
  city?: string;
  state?: string;
  stateCode?: string;
  zip?: string;
  lat?: number;
  lng?: number;
}

export interface LocationComboboxProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "size" | "type"
> {
  value: string;
  onChange: (value: string, meta?: LocationSelection) => void;
  containerClassName?: string;
  dropdownClassName?: string;
  startAdornment?: React.ReactNode;
  clearAriaLabel?: string;
  /** Render a "Your location" suggestion at the top of the dropdown. */
  includeCurrentLocation?: boolean;
  /** Label used for the "Your location" entry. */
  currentLocationLabel?: string;
}

function createSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readCachedCurrentLocation(): GeocodeResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CURRENT_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GeocodeResult;
  } catch {
    return null;
  }
}

function writeCachedCurrentLocation(result: GeocodeResult): void {
  try {
    sessionStorage.setItem(
      CURRENT_LOCATION_STORAGE_KEY,
      JSON.stringify(result),
    );
  } catch {
    // sessionStorage may be unavailable
  }
}

async function fetchSuggestions(
  query: string,
  sessionToken: string,
  proximity?: string,
): Promise<GeocodeSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    sessionToken,
  });
  if (proximity) {
    params.set("proximity", proximity);
  }
  const res = await fetch(`/api/geocode?${params.toString()}`);
  if (!res.ok) return [];
  return (await res.json()) as GeocodeSuggestion[];
}

async function fetchPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({ placeId, sessionToken });
  const res = await fetch(`/api/geocode?${params.toString()}`);
  if (!res.ok) return null;
  return (await res.json()) as GeocodeResult;
}

async function fetchReverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const res = await fetch(`/api/geocode?${params.toString()}`);
  if (!res.ok) return null;
  return (await res.json()) as GeocodeResult;
}

function toLocationSelection(result: GeocodeResult): LocationSelection {
  return {
    label: result.label,
    filterValue: result.filterValue,
    city: result.city,
    state: result.state,
    stateCode: result.stateCode,
    zip: result.zip,
    lat: result.lat,
    lng: result.lng,
  };
}

export const LocationCombobox = React.forwardRef<
  HTMLInputElement,
  LocationComboboxProps
>(function LocationCombobox(
  {
    value,
    onChange,
    containerClassName,
    dropdownClassName,
    startAdornment = <MapPin className="size-5" />,
    placeholder = 'City, state, zip code, or "remote"',
    clearAriaLabel = "Clear location",
    includeCurrentLocation = true,
    currentLocationLabel = "Your location",
    onFocus,
    onBlur,
    onKeyDown,
    className,
    ...inputProps
  },
  ref,
) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [currentLocation, setCurrentLocation] =
    React.useState<GeocodeResult | null>(null);
  const [currentLocationStatus, setCurrentLocationStatus] = React.useState<
    "idle" | "loading" | "unavailable"
  >("idle");
  const [proximity, setProximity] = React.useState<string | undefined>();
  const sessionTokenRef = React.useRef(createSessionToken());
  const debouncedValue = useDebouncedValue(value, 250);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const ensureSessionToken = React.useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = createSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  const resetSessionToken = React.useCallback(() => {
    sessionTokenRef.current = createSessionToken();
  }, []);

  React.useEffect(() => {
    if (!includeCurrentLocation) return;

    const cached = readCachedCurrentLocation();
    if (cached) {
      setCurrentLocation(cached);
      setProximity(`${cached.lng},${cached.lat}`);
      return;
    }

    if (!navigator.geolocation) {
      setCurrentLocationStatus("unavailable");
      return;
    }

    setCurrentLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setProximity(`${longitude},${latitude}`);
        const result = await fetchReverseGeocode(latitude, longitude);
        if (!result) {
          setCurrentLocationStatus("unavailable");
          return;
        }
        writeCachedCurrentLocation(result);
        setCurrentLocation(result);
        setCurrentLocationStatus("idle");
      },
      () => {
        setCurrentLocationStatus("unavailable");
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [includeCurrentLocation]);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["geocode", debouncedValue, proximity],
    queryFn: () =>
      fetchSuggestions(debouncedValue, ensureSessionToken(), proximity),
    enabled: open && debouncedValue.trim().length >= 2,
    staleTime: 5 * 60_000,
  });

  const showCurrentLocation =
    includeCurrentLocation && currentLocationStatus !== "unavailable";

  const items: Array<{
    key: string;
    label: string;
    kind: "current" | "suggestion";
    suggestion?: GeocodeSuggestion;
  }> = React.useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      kind: "current" | "suggestion";
      suggestion?: GeocodeSuggestion;
    }> = [];

    if (showCurrentLocation) {
      list.push({
        key: "__current__",
        label: currentLocation?.label ?? currentLocationLabel,
        kind: "current",
      });
    }

    for (const suggestion of suggestions) {
      list.push({
        key: suggestion.id,
        label: suggestion.label,
        kind: "suggestion",
        suggestion,
      });
    }

    return list;
  }, [showCurrentLocation, currentLocation, currentLocationLabel, suggestions]);

  React.useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedValue, open]);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectItem = async (item: (typeof items)[number]) => {
    setIsSelecting(true);
    try {
      if (item.kind === "current") {
        if (currentLocationStatus === "loading" || !currentLocation) return;
        onChange(currentLocation.label, toLocationSelection(currentLocation));
      } else if (item.suggestion) {
        const details = await fetchPlaceDetails(
          item.suggestion.id,
          ensureSessionToken(),
        );
        if (details) {
          onChange(details.label, toLocationSelection(details));
        } else {
          onChange(item.suggestion.label);
        }
      }
      resetSessionToken();
      setOpen(false);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || isSelecting) return;
    if (!open) {
      if (event.key === "ArrowDown" && items.length > 0) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : -1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) =>
        items.length ? (i <= 0 ? items.length - 1 : i - 1) : -1,
      );
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && items[activeIndex]) {
        event.preventDefault();
        void selectItem(items[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && items.length > 0;

  return (
    <div ref={wrapperRef} className={cn("relative w-full", containerClassName)}>
      <ClearableInput
        ref={ref}
        value={value}
        onChange={(event) => {
          ensureSessionToken();
          onChange(event.target.value);
          setOpen(true);
        }}
        onClear={() => {
          onChange("");
          setOpen(false);
        }}
        onFocus={(event) => {
          ensureSessionToken();
          setOpen(true);
          onFocus?.(event);
        }}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        startAdornment={startAdornment}
        placeholder={placeholder}
        clearAriaLabel={clearAriaLabel}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="location-combobox-listbox"
        aria-busy={isSelecting}
        aria-activedescendant={
          activeIndex >= 0 && items[activeIndex]
            ? `location-option-${items[activeIndex].key}`
            : undefined
        }
        className={className}
        {...inputProps}
      />
      {showDropdown ? (
        <ul
          id="location-combobox-listbox"
          role="listbox"
          className={cn(
            "bg-popover text-popover-foreground absolute z-50 mt-2 max-h-[320px] w-full overflow-auto rounded-md border p-1 shadow-md",
            dropdownClassName,
          )}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const isCurrentLoading =
              item.kind === "current" && currentLocationStatus === "loading";
            return (
              <li
                key={item.key}
                id={`location-option-${item.key}`}
                role="option"
                aria-selected={isActive}
                aria-disabled={isCurrentLoading || isSelecting}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (isSelecting || isCurrentLoading) return;
                  void selectItem(item);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-sm",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground",
                  (isCurrentLoading || isSelecting) &&
                    "pointer-events-none opacity-60",
                )}
              >
                {item.kind === "current" ? (
                  isCurrentLoading ? (
                    <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                  ) : (
                    <Home className="text-muted-foreground size-4 shrink-0" />
                  )
                ) : (
                  <MapPin className="text-muted-foreground size-4 shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </li>
            );
          })}
          {isFetching && items.length === (showCurrentLocation ? 1 : 0) ? (
            <li
              className="text-muted-foreground px-3 py-2 text-sm"
              role="status"
            >
              Searching…
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
});
