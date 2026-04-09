export type ParsedLocation = {
  city?: string;
  state?: string;
  zipcode?: string;
};

const ZIPCODE_REGEX = /^\d{5}$/;
const STATE_ABBREV_REGEX = /^[A-Z]{2}$/;

export function parseLocation(input: string): ParsedLocation {
  const trimmed = input.trim();
  if (!trimmed) return {};

  const segments = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result: ParsedLocation = {};

  for (const segment of segments) {
    if (ZIPCODE_REGEX.test(segment)) {
      result.zipcode = segment;
    } else if (STATE_ABBREV_REGEX.test(segment)) {
      result.state = segment;
    } else {
      result.city = segment;
    }
  }

  return result;
}
