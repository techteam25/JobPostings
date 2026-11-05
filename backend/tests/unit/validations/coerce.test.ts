import { describe, it, expect } from "vitest";

import { coerceQueryBool } from "@/validations/shared/coerce";

describe("coerceQueryBool", () => {
  const schema = coerceQueryBool();

  it("parses the string 'true' as true", () => {
    const result = schema.safeParse("true");
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(true);
  });

  it("parses the string 'false' as false", () => {
    const result = schema.safeParse("false");
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(false);
  });

  it("passes through boolean true", () => {
    const result = schema.safeParse(true);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(true);
  });

  it("passes through boolean false", () => {
    const result = schema.safeParse(false);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(false);
  });

  it("rejects the empty string", () => {
    expect(schema.safeParse("").success).toBe(false);
  });

  it("rejects '1' (strict mode)", () => {
    expect(schema.safeParse("1").success).toBe(false);
  });

  it("rejects undefined — use .optional() at the call site", () => {
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it("accepts undefined when wrapped in .optional()", () => {
    const optional = coerceQueryBool().optional();
    const result = optional.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBeUndefined();
  });
});
