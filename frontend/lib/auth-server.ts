import { env } from "@/env";

/**
 * Server-side session verification for use in middleware and server components
 * Uses native fetch for Edge Runtime compatibility (required for Next.js middleware)
 */
export async function getServerSession(
  cookieHeader?: string | null,
): Promise<{ session: any | null; user: any | null }> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/auth/get-session`,
      {
        method: "GET",
        headers: {
          cookie: cookieHeader || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store", // Don't cache auth checks
      },
    );

    if (!response.ok) {
      return { session: null, user: null };
    }

    const data = await response.json();

    return {
      session: data?.session || null,
      user: data?.user || null,
    };
  } catch (error) {
    console.error("Error fetching server session:", error);
    return { session: null, user: null };
  }
}
