/** Lightweight autocomplete row returned before Place Details is fetched. */
export interface GeocodeSuggestion {
  id: string;
  label: string;
}

/** Full geocode result with structured fields for filtering and display. */
export interface GeocodeResult {
  id: string;
  /** Short label for display (e.g. "Austin, TX"). */
  label: string;
  /**
   * Backend-matchable form for candidate search
   * (e.g. "Austin, Texas, United States").
   */
  filterValue: string;
  city?: string;
  /** Full state name, e.g. "Texas". */
  state?: string;
  /** USPS state abbreviation, e.g. "TX". */
  stateCode?: string;
  zip?: string;
  lat: number;
  lng: number;
}

export interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

/** Legacy Geocoding API address component shape. */
export interface LegacyAddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}
