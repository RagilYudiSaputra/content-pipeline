import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({
  children,
}: AppShellProps) {
  return (
    // ✅ Kunci tinggi layar pas 100vh dan matikan scroll global
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar: Otomatis terkunci diam di posisi kiri */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar: Tetap diam di atas konten */}
        <Navbar />

        {/* Main: HANYA area ini yang bisa di-scroll ke bawah */}
        <main className="flex-1 overflow-y-auto px-8 pt-2 pb-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}