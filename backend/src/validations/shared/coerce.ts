import { z } from "zod";

// Strict: only accepts "true"/"false" strings or real booleans. Rejects "1", "yes", etc.
// (z.coerce.boolean() uses JS Boolean() which makes any non-empty string truthy — so "false" would pass as true.)
export const coerceQueryBool = () =>
  z.preprocess((v) => {
    if (typeof v === "boolean") return v;
    if (v === "true") return true;
    if (v === "false") return false;
    return v;
  }, z.boolean());
