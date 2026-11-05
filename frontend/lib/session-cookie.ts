/**
 * Parses better-auth session cookies locally in Edge Runtime (middleware).
 * Eliminates the need for an HTTP call to /auth/get-session on every navigation.
 *
 * The __Secure-better-auth.session_data cookie is a base64-encoded JSON blob
 * containing the full session + user data + expiry + signature. We check existence
 * and expiry only — the backend API middleware remains the real security gate.
 */

type SessionData = {
  session: {
    expiresAt: string;
    token: string;
    userId: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    lastLoginAt: string | null;
    intent: "seeker" | "employer";
    onboardingStatus: "pending" | "completed";
  };
};

type CachedSession = {
  session: SessionData;
  expiresAt: number;
  signature: string;
};

export type ParsedSession =
  | { kind: "full"; session: SessionData["session"]; user: SessionData["user"] }
  | { kind: "token-only" };

const SESSION_DATA_COOKIE = "better-auth.session_data";
const SESSION_TOKEN_COOKIE = "better-auth.session_token";

function getCookieValue(
  cookieHeader: string,
  name: string,
): string | undefined {
  // Check both __Secure- prefixed (production) and plain (development)
  const secureName = `__Secure-${name}`;

  for (const cookie of cookieHeader.split(";")) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(`${secureName}=`)) {
      return trimmed.slice(secureName.length + 1);
    }
    if (trimmed.startsWith(`${name}=`)) {
      return trimmed.slice(name.length + 1);
    }
  }
  return undefined;
}

/**
 * Parse the session from cookies without any HTTP calls.
 *
 * Returns { session, user } if the session is valid, or null if:
 * - No session cookies exist
 * - The session has expired
 * - The cookie data is malformed
 *
 * If the session_data cache cookie has expired but the session_token
 * cookie still exists, the session is likely valid (cache just expired).
 * We extract what we can and let the backend verify on API calls.
 */
export function parseSessionCookie(
  cookieHeader: string | null,
): ParsedSession | null {
  if (!cookieHeader) return null;

  const sessionDataValue = getCookieValue(cookieHeader, SESSION_DATA_COOKIE);

  if (sessionDataValue) {
    try {
      const decoded = atob(decodeURIComponent(sessionDataValue));
      const parsed: CachedSession = JSON.parse(decoded);

      const sessionExpiry = new Date(
        parsed.session.session.expiresAt,
      ).getTime();
      if (sessionExpiry < Date.now()) {
        return null;
      }

      return {
        kind: "full",
        session: parsed.session.session,
        user: parsed.session.user,
      };
    } catch {
      return null;
    }
  }

  // session_data cache cookie missing or expired (e.g. dev mode where cookieCache
  // is disabled, or cache just expired in prod). If the session_token cookie still
  // exists the user is likely authenticated — return a "token-only" marker so the
  // middleware lets the request through without making routing decisions.
  const sessionTokenValue = getCookieValue(cookieHeader, SESSION_TOKEN_COOKIE);
  if (sessionTokenValue) {
    return { kind: "token-only" };
  }

  return null;
}
