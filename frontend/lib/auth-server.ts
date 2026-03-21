import { env } from "@/env";

type BetterAuthSession = {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
  } | null;
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
    status: string;
    deletedAt?: Date | null | undefined;
    lastLoginAt?: Date | null | undefined;
  } | null;
};

/**
 * Server-side session verification for use in middleware and server components
 * Uses native fetch for Edge Runtime compatibility (required for Next.js middleware)
 */
export async function getServerSession(
  cookieHeader?: string | null,
): Promise<BetterAuthSession> {
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
