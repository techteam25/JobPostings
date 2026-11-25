import type { NextRequest } from "next/server";
import { middleware } from "./middleware";

const responses = vi.hoisted(() => ({
  next: vi.fn(() => ({ type: "next" })),
  redirect: vi.fn(() => ({ type: "redirect" })),
}));

vi.mock("next/server", () => ({ NextResponse: responses }));
vi.mock("@/lib/session-cookie", () => ({
  parseSessionCookie: vi.fn(() => null),
}));

describe("public legal routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["/terms", "/privacy"])("allows %s before signup", (pathname) => {
    const request = { nextUrl: { pathname } } as NextRequest;

    expect(middleware(request)).toEqual({ type: "next" });
    expect(responses.redirect).not.toHaveBeenCalled();
  });
});
