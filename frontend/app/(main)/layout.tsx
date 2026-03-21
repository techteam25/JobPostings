import { ReactNode } from "react";
import { headers } from "next/headers";

import Navbar from "@/app/(main)/components/Navbar";
import { EmailVerificationBanner } from "@/components/common/EmailVerificationBanner";
import { getServerSession } from "@/lib/auth-server";

async function Layout({ children }: { children: ReactNode }) {
  const { user } = await getServerSession((await headers()).get("cookie"));
  const showBanner = !!user && !user.emailVerified;

  return (
    <div>
      {showBanner && <EmailVerificationBanner email={user.email} />}
      <Navbar />
      {children}
    </div>
  );
}

export default Layout;
