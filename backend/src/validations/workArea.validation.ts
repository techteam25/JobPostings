import { z } from "zod";

export const updateWorkAreasSchema = z.object({
  body: z.object({
    workAreaIds: z
      .array(z.number().int().positive())
      .default([])
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Duplicate work area IDs are not allowed",
      }),
  }),
  params: z.object({}),
  query: z.object({}),
});

export type UpdateWorkAreasBody = z.infer<typeof updateWorkAreasSchema>["body"];
