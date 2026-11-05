import { describe, it, expect } from "vitest";

import { searchCandidatesQuerySchema } from "@/validations/candidate-search.validation";
import { searchParams } from "@/validations/base.validation";

// Regression tests for the z.coerce.boolean() bug where "false" was coerced to true.
// These exercise the same schemas that run inside the validate() middleware.

describe("candidate-search.validation — openToWork query coercion", () => {
  it("parses openToWork=false as boolean false", () => {
    const result = searchCandidatesQuerySchema.safeParse({
      openToWork: "false",
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.openToWork).toBe(false);
  });

  it("parses openToWork=true as boolean true", () => {
    const result = searchCandidatesQuerySchema.safeParse({
      openToWork: "true",
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.openToWork).toBe(true);
  });

  it("leaves openToWork undefined when omitted", () => {
    const result = searchCandidatesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.success && result.data.openToWork).toBeUndefined();
  });

  it("rejects openToWork with an invalid boolean string", () => {
    const result = searchCandidatesQuerySchema.safeParse({ openToWork: "1" });
    expect(result.success).toBe(false);
  });
});

describe("base.validation searchParams — includeRemote/isActive query coercion", () => {
  const parse = (query: Record<string, unknown>) =>
    searchParams.safeParse({ body: {}, params: {}, query });

  it("parses includeRemote=false as boolean false", () => {
    const result = parse({ includeRemote: "false" });
    expect(result.success).toBe(true);
    expect(result.success && result.data.query.includeRemote).toBe(false);
  });

  it("parses includeRemote=true as boolean true", () => {
    const result = parse({ includeRemote: "true" });
    expect(result.success).toBe(true);
    expect(result.success && result.data.query.includeRemote).toBe(true);
  });

  it("parses isActive=false as boolean false", () => {
    const result = parse({ isActive: "false" });
    expect(result.success).toBe(true);
    expect(result.success && result.data.query.isActive).toBe(false);
  });

  it("parses isActive=true as boolean true", () => {
    const result = parse({ isActive: "true" });
    expect(result.success).toBe(true);
    expect(result.success && result.data.query.isActive).toBe(true);
  });

  it("rejects isActive with an invalid boolean string", () => {
    const result = parse({ isActive: "yes" });
    expect(result.success).toBe(false);
  });
});
