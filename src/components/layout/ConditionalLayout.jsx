"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";


export default function ConditionalLayout({ children }) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}

      {children}

      {!isAdmin && <Footer />}
    </>
  );
}