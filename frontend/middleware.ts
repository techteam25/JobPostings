// middleware.ts
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth-server";
import { env } from "@/env";
import { UserIntentResponse } from "@/schemas/responses/users";
import {
  OrganizationIdByMemberIdResponse,
  OrganizationWithMembersResponse,
} from "@/schemas/responses/organizations";

async function fetchOrganization(
  userId: string,
  cookieHeader: string,
): Promise<OrganizationIdByMemberIdResponse | null> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/organizations/members/${userId}`,
      {
        headers: {
          cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        credentials: "include",
        next: { revalidate: 300 },
      },
    );

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/sign-in", "/sign-up", "/"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Get cookies from the request - try multiple methods
  const cookieHeader = req.headers.get("cookie");

  // Extract all cookies and build cookie string
  const cookies = req.cookies.getAll();
  const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  // Use better-auth server-side session verification - try cookieString first, fallback to cookieHeader
  const { session, user } = await getServerSession(
    cookieString || cookieHeader,
  );

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
          cookie: cookieString || cookieHeader || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
        next: { revalidate: 300 },
      },
    );

    if (!onboardingResponse.ok) {
      return NextResponse.next();
    }

    const onboarding: UserIntentResponse = await onboardingResponse.json();

    if (!onboarding?.success) {
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
      let orgData: OrganizationIdByMemberIdResponse | null = null;

      // Prevent access to onboarding routes after completion
      if (pathname.startsWith("/employer/onboarding")) {
        if (intent === "employer") {
          // Fetch organization data to redirect to organization page
          orgData = await fetchOrganization(
            user.id,
            cookieString || cookieHeader || "",
          );

          if (orgData?.success && orgData.data) {
            return NextResponse.redirect(
              new URL(
                `/employer/organizations/${orgData.data.organizationId}`,
                req.url,
              ),
            );
          } else {
            // If organization fetch fails, redirect to home
            return NextResponse.redirect(new URL("/", req.url));
          }
        } else {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }

      // If employer with completed status, ensure they have an organization
      if (
        intent === "employer" &&
        !pathname.startsWith("/employer/organizations") &&
        pathname !== "/" // Allow access to home page
      ) {
        // Only fetch if not already cached from previous check
        if (!orgData) {
          orgData = await fetchOrganization(
            user.id,
            cookieString || cookieHeader || "",
          );
        }

        if (orgData?.success && orgData.data) {
          // Redirect to their organization dashboard
          return NextResponse.redirect(
            new URL(
              `/employer/organizations/${orgData.data.organizationId}`,
              req.url,
            ),
          );
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
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
