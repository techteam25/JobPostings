const PROTOCOL_REGEX = /^https?:\/\//i;
// Matches inputs that contain only a protocol (e.g. "https://", "http://").
// These should be treated as empty — normalizing would otherwise hand
// `z.url()` a guaranteed-invalid string and surface a confusing "Invalid URL"
// error when the user meant "I didn't type anything meaningful yet".
const PROTOCOL_ONLY_REGEX = /^https?:\/\/$/i;

export function hasProtocol(input: string): boolean {
  return PROTOCOL_REGEX.test(input);
}

export function normalizeUrl(
  input: unknown,
  protocol: "https" | "http" = "https",
): string {
  const trimmed = typeof input === "string" ? input.trim() : "";
  if (!trimmed) return "";
  if (PROTOCOL_ONLY_REGEX.test(trimmed)) return "";
  if (PROTOCOL_REGEX.test(trimmed)) return trimmed;
  return `${protocol}://${trimmed}`;
}

export function stripProtocol(input: string): string {
  return input.replace(PROTOCOL_REGEX, "");
}
