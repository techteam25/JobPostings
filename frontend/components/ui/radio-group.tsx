"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

type RadioGroupItemProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> & {
  className?: string;
  indicatorClassName?: string;
  circleClassName?: string;
  children?: React.ReactNode;
};

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(
  (
    { className, indicatorClassName, circleClassName, children, ...props },
    ref,
  ) => {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          "border-primary text-primary focus-visible:ring-ring aspect-square h-4 w-4 rounded-full border shadow focus:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          className={cn("flex items-center justify-center", indicatorClassName)}
        >
          {children ?? (
            <Circle
              className={cn("fill-accent h-3.5 w-3.5", circleClassName)}
            />
          )}
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  },
);
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
