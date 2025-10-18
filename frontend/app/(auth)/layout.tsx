import { ReactNode } from "react";
import { Navbar } from "./Navbar";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/*<Navbar />*/}
      {children}
    </div>
  );
}

export default Layout;
