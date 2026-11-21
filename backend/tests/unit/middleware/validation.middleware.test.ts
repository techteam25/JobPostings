import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { NextFunction, Request, Response } from "express";

import validate from "@/middleware/validation.middleware";

const schema = z.object({
  body: z.object({ displayName: z.string().trim().min(1) }),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

describe("validation middleware", () => {
  it("passes transformed body values to the controller", () => {
    const req = {
      body: { displayName: "  Christy  ", extra: "dropped" },
      params: {},
      query: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ displayName: "Christy" });
  });

  it("reports a precise field reason for invalid input", () => {
    const req = {
      body: { displayName: "" },
      params: {},
      query: {},
    } as unknown as Request;
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0]?.[0]).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        details: [{ field: "body.displayName" }],
      },
    });
  });
});
