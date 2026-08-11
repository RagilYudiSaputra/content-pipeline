"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased">
      {/* Oper state collapsed & setCollapsed ke Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Dynamic Padding: md:pl-20 saat ditutup, md:pl-60 saat dibuka */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          collapsed ? "md:pl-20" : "md:pl-60"
        }`}
      >
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 pt-16 md:pt-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}