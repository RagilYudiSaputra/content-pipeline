import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased">
      {/* Sidebar Desktop & Navigation Mobile */}
      <Sidebar />

      {/* Main Content Area (md:pl-64 mencegah konten desktop tertutup sidebar) */}
      <div className="flex flex-col md:pl-64">
        {/* Navbar Atas (Berisi Judul + Icon Profil/Logout Mobile & Desktop) */}
        <Navbar />

        {/* Main Content (pb-20 di mobile agar tidak tertutup bottom navbar) */}
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}