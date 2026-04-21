"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, MapPin } from "lucide-react";

import { ClearableInput } from "@/components/ui/clearable-input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

export interface GeocodeResult {
  id: string;
  label: string;
  filterValue: string;
  city?: string;
  state?: string;
  stateCode?: string;
  zip?: string;
  lat: number;
  lng: number;
}

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

async function fetchSuggestions(query: string): Promise<GeocodeResult[]> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return (await res.json()) as GeocodeResult[];
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
  const debouncedValue = useDebouncedValue(value, 250);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["geocode", debouncedValue],
    queryFn: () => fetchSuggestions(debouncedValue),
    enabled: open && debouncedValue.trim().length >= 2,
    staleTime: 5 * 60_000,
  });

  const items: Array<{
    key: string;
    label: string;
    kind: "current" | "suggestion";
    result?: GeocodeResult;
  }> = React.useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      kind: "current" | "suggestion";
      result?: GeocodeResult;
    }> = [];
    if (includeCurrentLocation) {
      list.push({
        key: "__current__",
        label: currentLocationLabel,
        kind: "current",
      });
    }
    for (const s of suggestions) {
      list.push({ key: s.id, label: s.label, kind: "suggestion", result: s });
    }
    return list;
  }, [includeCurrentLocation, currentLocationLabel, suggestions]);

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

  const selectItem = (item: (typeof items)[number]) => {
    if (item.kind === "current") {
      onChange(currentLocationLabel);
    } else if (item.result) {
      onChange(item.result.label, {
        label: item.result.label,
        filterValue: item.result.filterValue,
        city: item.result.city,
        state: item.result.state,
        stateCode: item.result.stateCode,
        zip: item.result.zip,
        lat: item.result.lat,
        lng: item.result.lng,
      });
    }
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
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
        selectItem(items[activeIndex]);
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
          onChange(event.target.value);
          setOpen(true);
        }}
        onClear={() => {
          onChange("");
          setOpen(false);
        }}
        onFocus={(event) => {
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
            return (
              <li
                key={item.key}
                id={`location-option-${item.key}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectItem(item);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-sm",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground",
                )}
              >
                {item.kind === "current" ? (
                  <Home className="text-muted-foreground size-4 shrink-0" />
                ) : (
                  <MapPin className="text-muted-foreground size-4 shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </li>
            );
          })}
          {isFetching && items.length === (includeCurrentLocation ? 1 : 0) ? (
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
