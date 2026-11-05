"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ClearableInputProps extends Omit<
  React.ComponentProps<"input">,
  "size"
> {
  onClear?: () => void;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  containerClassName?: string;
  clearAriaLabel?: string;
}

export const ClearableInput = React.forwardRef<
  HTMLInputElement,
  ClearableInputProps
>(
  (
    {
      className,
      containerClassName,
      value,
      onClear,
      startAdornment,
      endAdornment,
      type,
      clearAriaLabel = "Clear input",
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const hasValue =
      typeof value === "string" ? value.length > 0 : Boolean(value);
    const shouldShowClear = hasValue && Boolean(onClear);

    const handleClear = () => {
      onClear?.();
      innerRef.current?.focus();
    };

    return (
      <div
        className={cn("relative flex w-full items-center", containerClassName)}
      >
        {startAdornment ? (
          <span
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute left-3 flex items-center"
          >
            {startAdornment}
          </span>
        ) : null}
        <input
          ref={innerRef}
          type={type}
          value={value}
          className={cn(
            "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-accent [&[aria-invalid=true]]:border-destructive [&[aria-invalid=true]]:focus-visible:ring-destructive flex h-12 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            startAdornment ? "pl-10" : undefined,
            shouldShowClear || endAdornment ? "pr-10" : undefined,
            className,
          )}
          {...props}
        />
        {shouldShowClear ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label={clearAriaLabel}
            tabIndex={-1}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-accent absolute right-2 flex size-7 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        ) : endAdornment ? (
          <span
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute right-3 flex items-center"
          >
            {endAdornment}
          </span>
        ) : null}
      </div>
    );
  },
);
ClearableInput.displayName = "ClearableInput";
