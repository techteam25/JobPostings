import { ReactNode } from "react";

function Layout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}

export default Layout;
