"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { hasProtocol, normalizeUrl, stripProtocol } from "@/lib/url";

export { normalizeUrl, stripProtocol };

export interface UrlInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "onChange" | "value"
> {
  value: string;
  onChange: (value: string) => void;
  protocol?: "https" | "http";
  containerClassName?: string;
  invalid?: boolean;
}

export const UrlInput = React.forwardRef<HTMLInputElement, UrlInputProps>(
  (
    {
      value,
      onChange,
      protocol = "https",
      className,
      containerClassName,
      invalid,
      onPaste,
      ...props
    },
    ref,
  ) => {
    const prefix = `${protocol}://`;
    const displayValue = stripProtocol(value ?? "");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(stripProtocol(event.target.value));
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(event);
      if (event.defaultPrevented) return;
      const pasted = event.clipboardData.getData("text");
      if (hasProtocol(pasted)) {
        event.preventDefault();
        onChange(stripProtocol(pasted).trim());
      }
    };

    return (
      <div
        data-invalid={invalid || undefined}
        className={cn(
          "border-input focus-within:ring-accent data-[invalid=true]:border-destructive data-[invalid=true]:focus-within:ring-destructive flex h-12 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-sm transition-colors focus-within:ring-1",
          containerClassName,
        )}
      >
        <span
          aria-hidden
          className="text-muted-foreground bg-muted/40 flex h-full items-center border-r px-3 text-base font-normal select-none md:text-sm"
        >
          {prefix}
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={displayValue}
          onChange={handleChange}
          onPaste={handlePaste}
          className={cn(
            "placeholder:text-muted-foreground h-full flex-1 bg-transparent px-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
UrlInput.displayName = "UrlInput";
