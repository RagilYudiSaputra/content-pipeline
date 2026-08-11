"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Component */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Navbar Component */}
      <Navbar
        collapsed={collapsed}
        onOpenMobileMenu={() => setMobileOpen(true)}
      />

      {/* Main Content Area (Perbaikan class padding ada di sini) */}
      <main
        className={`pt-20 pb-20 md:pb-6 px-4 md:px-6 transition-all duration-300 ${
          collapsed ? "md:pl-24" : "md:pl-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}