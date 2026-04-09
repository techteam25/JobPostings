import { parseLocation } from "@/lib/parse-location";

describe("parseLocation", () => {
  it("returns empty object for empty string", () => {
    expect(parseLocation("")).toEqual({});
  });

  it("returns empty object for whitespace-only string", () => {
    expect(parseLocation("   ")).toEqual({});
  });

  it("parses city and state from 'Boston, MA'", () => {
    expect(parseLocation("Boston, MA")).toEqual({
      city: "Boston",
      state: "MA",
    });
  });

  it("parses standalone zipcode", () => {
    expect(parseLocation("02101")).toEqual({ zipcode: "02101" });
  });

  it("parses city, state, and zipcode from 'Boston, MA, 02101'", () => {
    expect(parseLocation("Boston, MA, 02101")).toEqual({
      city: "Boston",
      state: "MA",
      zipcode: "02101",
    });
  });

  it("parses standalone state abbreviation", () => {
    expect(parseLocation("TX")).toEqual({ state: "TX" });
  });

  it("parses standalone city name", () => {
    expect(parseLocation("New York")).toEqual({ city: "New York" });
  });

  it("parses multi-word city with state", () => {
    expect(parseLocation("San Francisco, CA")).toEqual({
      city: "San Francisco",
      state: "CA",
    });
  });

  it("trims whitespace from segments", () => {
    expect(parseLocation("  Boston ,  MA , 02101  ")).toEqual({
      city: "Boston",
      state: "MA",
      zipcode: "02101",
    });
  });

  it("does not match lowercase as state abbreviation", () => {
    expect(parseLocation("ma")).toEqual({ city: "ma" });
  });

  it("does not match 3-letter codes as state abbreviation", () => {
    expect(parseLocation("NYC")).toEqual({ city: "NYC" });
  });

  it("does not match partial zipcodes", () => {
    expect(parseLocation("0210")).toEqual({ city: "0210" });
  });

  it("does not match 6-digit numbers as zipcode", () => {
    expect(parseLocation("021012")).toEqual({ city: "021012" });
  });

  it("handles zipcode with state", () => {
    expect(parseLocation("TX, 75001")).toEqual({
      state: "TX",
      zipcode: "75001",
    });
  });

  it("uses last city segment when multiple non-state non-zip segments exist", () => {
    // Edge case: "Portland, Oregon" — "Oregon" is not 2-letter uppercase
    const result = parseLocation("Portland, Oregon");
    // Both are treated as city candidates; last one wins
    expect(result).toEqual({ city: "Oregon" });
  });
});
