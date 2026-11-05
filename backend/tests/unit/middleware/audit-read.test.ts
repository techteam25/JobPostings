import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import type { Request, Response, NextFunction } from "express";

const { mockEmit } = vi.hoisted(() => ({ mockEmit: vi.fn() }));

vi.mock("@shared/audit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@shared/audit")>();
  return {
    ...original,
    auditService: { emit: mockEmit },
  };
});

import { auditRead } from "@/middleware/audit-read.middleware";

type MockRes = Response & EventEmitter & { statusCode: number };

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    userId: 42,
    ip: "127.0.0.1",
    headers: { "user-agent": "vitest/1.0" },
    params: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes(statusCode: number): MockRes {
  const res = new EventEmitter() as MockRes;
  res.statusCode = statusCode;
  return res;
}

describe("auditRead middleware", () => {
  beforeEach(() => {
    mockEmit.mockReset();
  });

  it("emits the expected envelope on successful response (< 400)", () => {
    const middleware = auditRead("read.invitation.by_token", (req) => ({
      type: "invitation",
      id: String(req.params.organizationId),
    }));

    const req = makeReq({ params: { organizationId: "org-7" } });
    const res = makeRes(200);
    const next: NextFunction = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(mockEmit).not.toHaveBeenCalled();

    res.emit("finish");

    expect(mockEmit).toHaveBeenCalledOnce();
    expect(mockEmit).toHaveBeenCalledWith({
      name: "read.invitation.by_token",
      actor: { id: 42, ip: "127.0.0.1", userAgent: "vitest/1.0" },
      resource: { type: "invitation", id: "org-7" },
      action: "read",
      outcome: "success",
    });
  });

  it("does NOT emit on failure response (>= 400)", () => {
    const middleware = auditRead("read.admin");
    const req = makeReq();
    const res = makeRes(403);
    const next: NextFunction = vi.fn();

    middleware(req, res, next);
    res.emit("finish");

    expect(mockEmit).not.toHaveBeenCalled();
  });

  it("falls back to { type: 'unknown' } when no resolver given", () => {
    const middleware = auditRead("read.admin");
    const req = makeReq();
    const res = makeRes(200);
    const next: NextFunction = vi.fn();

    middleware(req, res, next);
    res.emit("finish");

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "read.admin",
        resource: { type: "unknown" },
      }),
    );
  });

  it("handles unauthenticated requests (no userId) without throwing", () => {
    const middleware = auditRead("read.invitation.by_token");
    const req = makeReq({ userId: undefined });
    const res = makeRes(200);
    const next: NextFunction = vi.fn();

    middleware(req, res, next);
    res.emit("finish");

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: expect.objectContaining({ id: undefined }),
      }),
    );
  });
});
