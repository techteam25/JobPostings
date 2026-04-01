// middleware.ts
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth-server";
import { env } from "@/env";
import { UserIntentResponse } from "@/schemas/responses/users";

export async function middleware(req: NextRequest) {
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

  // Use the raw Cookie header — reconstructing from parsed cookies can corrupt
  // token values containing special characters (e.g. better-auth session tokens)
  const cookieHeader = req.headers.get("cookie");

  const { session, user } = await getServerSession(cookieHeader);

  // If user is not authenticated, redirect to '/sign-in'
  if (!session || !user) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    return NextResponse.next();
  }

  // User is authenticated - fetch their intent/onboarding status
  try {
    const onboardingResponse = await fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/users/me/intent`,
      {
        headers: {
          cookie: cookieHeader || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      },
    );

    if (!onboardingResponse.ok) {
      // Intent API unavailable — allow authenticated user through
      return NextResponse.next();
    }

    const onboarding: UserIntentResponse = await onboardingResponse.json();

    if (!onboarding?.success) {
      // No intent data yet (new user) — allow through to set intent
      return NextResponse.next();
    }

    const { intent, status } = onboarding.data;

    // If user status is pending
    if (status === "pending") {
      if (intent === "employer") {
        // Redirect to employer onboarding if not already there
        if (!pathname.startsWith("/employer/onboarding")) {
          return NextResponse.redirect(
            new URL("/employer/onboarding", req.url),
          );
        }
      } else if (intent === "seeker") {
        // Redirect to home if not already there
        if (pathname !== "/" && !isPublicRoute) {
          return NextResponse.next();
        }
      }
    }

    // If status is completed
    if (status === "completed") {
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
  } catch (error) {
    // User is authenticated (session verified above) but onboarding status
    // check failed. Allow access rather than blocking authenticated users
    // when the intent API is unavailable.
    if (process.env.NODE_ENV === "development") {
      console.error("Middleware onboarding check failed:", error);
    }
    return NextResponse.next();
  }
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
