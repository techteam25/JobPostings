import { ReactNode } from "react";
import Navbar from "@/app/(main)/components/Navbar";
import { EmailVerificationBanner } from "@/components/common/EmailVerificationBanner";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <EmailVerificationBanner />
      <Navbar />
      {children}
    </div>
  );
}

export default Layout;
