import { WORK_SCHEDULE_DAY_OPTIONS } from "@/schemas/job-preferences";

const dayOrder = new Map<string, number>(
  WORK_SCHEDULE_DAY_OPTIONS.map((option, index) => [option.value, index]),
);

/** Order selected weekdays consistently, including preferences saved earlier. */
export function orderWorkScheduleDays(days: string[]): string[] {
  return [...days].sort(
    (left, right) =>
      (dayOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
      (dayOrder.get(right) ?? Number.MAX_SAFE_INTEGER),
  );
}
