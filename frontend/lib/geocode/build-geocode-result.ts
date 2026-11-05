import type { GoogleAddressComponent, GeocodeResult } from "./types";

export const COUNTRY_LABEL = "United States";

export function buildLabel(
  primary: string,
  stateCode: string | undefined,
): string {
  if (!primary) return "";
  if (!stateCode) return primary;
  return `${primary}, ${stateCode}`;
}

export function buildFilterValue(
  primary: string,
  stateFullName: string | undefined,
  isZipOnly: boolean,
): string {
  if (isZipOnly) return "";
  if (!primary) return "";
  if (!stateFullName) return primary;
  return `${primary}, ${stateFullName}, ${COUNTRY_LABEL}`;
}

export function parseAddressComponents(components: GoogleAddressComponent[]): {
  city?: string;
  state?: string;
  stateCode?: string;
  zip?: string;
} {
  const find = (type: string) =>
    components.find((component) => component.types?.includes(type));

  const locality =
    find("locality") ?? find("postal_town") ?? find("sublocality_level_1");
  const admin1 = find("administrative_area_level_1");
  const postal = find("postal_code");

  return {
    city: locality?.longText,
    state: admin1?.longText,
    stateCode: admin1?.shortText,
    zip: postal?.longText ?? postal?.shortText,
  };
}

export function normalizeLegacyAddressComponents(
  components: Array<{
    long_name?: string;
    short_name?: string;
    types?: string[];
  }>,
): GoogleAddressComponent[] {
  return components.map((component) => ({
    longText: component.long_name,
    shortText: component.short_name,
    types: component.types,
  }));
}

export function buildGeocodeResultFromPlace(
  placeId: string,
  location: { latitude: number; longitude: number },
  addressComponents: GoogleAddressComponent[],
  types: string[],
): GeocodeResult {
  const parsed = parseAddressComponents(addressComponents);
  const isZipOnly =
    types.includes("postal_code") &&
    !types.includes("locality") &&
    !types.includes("postal_town");
  const isStateOnly =
    types.includes("administrative_area_level_1") && !parsed.city && !isZipOnly;

  let primary: string;
  if (isZipOnly) {
    primary = parsed.zip ?? "";
  } else if (isStateOnly) {
    primary = parsed.state ?? "";
  } else {
    primary = parsed.city ?? parsed.state ?? parsed.zip ?? "";
  }

  const label = isStateOnly
    ? (parsed.state ?? primary)
    : buildLabel(primary, parsed.stateCode);

  let filterValue: string;
  if (isZipOnly) {
    filterValue = "";
  } else if (isStateOnly) {
    filterValue = primary ? `${primary}, ${COUNTRY_LABEL}` : "";
  } else {
    filterValue = buildFilterValue(primary, parsed.state, false);
  }

  return {
    id: placeId,
    label,
    filterValue,
    city: parsed.city,
    state: parsed.state,
    stateCode: parsed.stateCode,
    zip: parsed.zip,
    lat: location.latitude,
    lng: location.longitude,
  };
}
