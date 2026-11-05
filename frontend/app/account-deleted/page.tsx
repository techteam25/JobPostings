import { cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Account Deleted",
};

// Cookie names mirror the set used by the Better-Auth session (see
// lib/session-cookie.ts). We clear both plain and __Secure- variants so
// dev and prod environments are covered.
const SESSION_COOKIES = [
  "better-auth.session_data",
  "better-auth.session_token",
  "__Secure-better-auth.session_data",
  "__Secure-better-auth.session_token",
];

export default async function AccountDeletedPage() {
  // Server-side cookie clear. Better-Auth has already revoked the session
  // server-side by this point — this just removes the stale cookies the
  // browser is still carrying
  const cookieStore = await cookies();
  for (const name of SESSION_COOKIES) {
    cookieStore.delete(name);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-accent mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-primary size-8" />
        </div>

        <h1 className="text-foreground mb-2 text-2xl font-bold">
          Your account has been deleted
        </h1>

        <p className="text-muted-foreground mb-6">
          Thanks for being part of getINvolved. Your profile and associated data
          have been permanently removed from our system.
        </p>

        <Button
          asChild
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full cursor-pointer"
        >
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
