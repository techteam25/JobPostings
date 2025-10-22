import { createAuthClient } from "better-auth/react";
import { env } from "../env";
export const authClient = createAuthClient({
  /** The base URL of the server */
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
});
