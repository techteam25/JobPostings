// middleware.ts
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth-server";
import { env } from "@/env";
import { UserIntentResponse } from "@/schemas/responses/users";
import {
  OrganizationIdByMemberIdResponse,
  OrganizationWithMembersResponse,
} from "@/schemas/responses/organizations";

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
        cache: "no-store",
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
      // Prevent access to onboarding routes after completion
      if (pathname.startsWith("/employer/onboarding")) {
        if (intent === "employer") {
          // Fetch organization data to redirect to organization page
          try {
            const orgFetchResponse = await fetch(
              `${env.NEXT_PUBLIC_SERVER_URL}/organizations/members/${user.id}`,
              {
                headers: {
                  cookie: cookieHeader || "",
                  "Content-Type": "application/json",
                },
                credentials: "include",
                cache: "no-store",
              },
            );

            if (orgFetchResponse.ok) {
              const orgResponse: OrganizationWithMembersResponse =
                await orgFetchResponse.json();

              if (orgResponse?.success && orgResponse.data) {
                return NextResponse.redirect(
                  new URL(
                    `/employer/organizations/${orgResponse.data.id}`,
                    req.url,
                  ),
                );
              }
            }
          } catch (error) {
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
        try {
          const orgFetchResponse = await fetch(
            `${env.NEXT_PUBLIC_SERVER_URL}/organizations/members/${user.id}`,
            {
              headers: {
                cookie: cookieString || cookieHeader || "",
                "Content-Type": "application/json",
              },
              credentials: "include",
              cache: "no-store",
            },
          );

          console.log("Org fetch status:", orgFetchResponse.status);
          console.log("Org fetch ok:", orgFetchResponse.ok);

          if (orgFetchResponse.ok) {
            const orgResponse: OrganizationIdByMemberIdResponse =
              await orgFetchResponse.json();

            console.log("Org response:", orgResponse);

            if (orgResponse?.success && orgResponse.data) {
              const redirectUrl = `/employer/organizations/${orgResponse.data.organizationId}`;
              console.log("Redirecting employer to:", redirectUrl);

              // Redirect to their organization dashboard
              return NextResponse.redirect(new URL(redirectUrl, req.url));
            } else {
              console.log("Org response not successful or no data");
            }
          } else {
            console.log(
              "Org fetch failed with status:",
              orgFetchResponse.status,
            );

            // Log the error response
            try {
              const errorText = await orgFetchResponse.text();
              console.log("Error response body:", errorText);
            } catch (e) {
              console.log("Could not read error response");
            }

            // If 400 or 404, user might not have an organization yet
            // Allow them to access the app normally
            if (
              orgFetchResponse.status === 400 ||
              orgFetchResponse.status === 404
            ) {
              console.log(
                "User doesn't have an organization yet, allowing access",
              );
            }
          }
        } catch (error) {
          // If no organization found, continue to allow access
          console.error("Error fetching organization:", error);
        }

        console.log("=== END EMPLOYER ORG CHECK ===");
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
