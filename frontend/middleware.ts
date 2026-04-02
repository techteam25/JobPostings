// middleware.ts
import { NextRequest, NextResponse } from "next/server";

import { parseSessionCookie } from "@/lib/session-cookie";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/sign-in",
    "/sign-up",
    "/verify-email",
    "/email-verified",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute =
    pathname === "/" ||
    publicRoutes.some((route) => pathname.startsWith(route));

  // Parse session + intent directly from cookies — zero HTTP calls.
  // The backend API middleware remains the real security gate.
  const cookieHeader = req.headers.get("cookie");
  const parsed = parseSessionCookie(cookieHeader);

  // If user is not authenticated, redirect to '/sign-in'
  if (!parsed) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    return NextResponse.next();
  }

  // "token-only" means the session_data cache cookie is missing (e.g. dev mode
  // or expired in prod) but the session_token exists — user is authenticated.
  // We can't make intent-based routing decisions, so just let the request through.
  // The backend API middleware will do the real auth check on any API calls.
  if (parsed.kind === "token-only") {
    return NextResponse.next();
  }

  // Read intent from session cookie (denormalized on user table,
  // cached in better-auth session_data cookie automatically)
  const { intent, onboardingStatus } = parsed.user;

  // If onboarding is pending
  if (onboardingStatus === "pending") {
    if (intent === "employer") {
      // Force pending employers to onboarding
      if (!pathname.startsWith("/employer/onboarding")) {
        return NextResponse.redirect(new URL("/employer/onboarding", req.url));
      }
    }
    // Pending seekers can browse freely
  }

  // If onboarding is completed
  if (onboardingStatus === "completed") {
    // Prevent access to onboarding routes after completion
    if (pathname.startsWith("/employer/onboarding")) {
      if (intent === "employer") {
        return NextResponse.redirect(
          new URL("/employer/organizations", req.url),
        );
      } else {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Prevent completed seekers from accessing /welcome
    if (pathname === "/welcome") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|__nextjs_original-stack-frame|_next/turbopack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
