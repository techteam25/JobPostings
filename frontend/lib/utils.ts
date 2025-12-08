import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistance, subDays, format, formatRelative } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPostedDate(date: Date) {
  return formatDistance(subDays(new Date(date), 0), new Date(), {
    addSuffix: true,
  });
}

export function formatToReadableDate(date: Date) {
  return format(new Date(date), "MMMM dd, yyyy");
}

export function formatToRelativeDate(date: Date) {
  // should format relative to now.
  // After format relative, strip the time component from the returned string
  const relative = formatRelative(new Date(date), new Date()).split(" at ")[0];
  return relative[0].toUpperCase() + relative.slice(1);
}
