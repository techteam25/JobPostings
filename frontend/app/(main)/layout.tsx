import { ReactNode } from "react";
import Navbar from "@/app/(main)/_components/Navbar";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}

export default Layout;
