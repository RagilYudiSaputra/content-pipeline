"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import {
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/providers/auth-provider";

const menus = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Content",
    href: "/content",
    icon: FileText,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { profile } = useAuth();

  // State Desktop Collapse
  const [collapsed, setCollapsed] = useState(false);

  // State Mobile Drawer Open/Close
  const [mobileOpen, setMobileOpen] = useState(false);

  // State Dropdown User Menu
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Otomatis tutup mobile drawer saat rute berpindah
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initials =
    profile?.fullName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  const roleLabel =
    profile?.role === "admin"
      ? "Administrator"
      : profile?.role === "designer"
      ? "Designer"
      : "Loading...";

  const handleLogout = async () => {
    try {
      setOpenMenu(false);
      setMobileOpen(false);

      await signOut(auth);

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout gagal:", error);
    }
  };

  return (
    <>
      {/* ==================== 1. MOBILE TOP BAR & BOTTOM NAV (Hanya Muncul di Mobile) ==================== */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-xs">
            <BookOpen className="text-white" size={16} />
          </div>
          <span className="text-sm font-bold text-slate-900">Wawasan CMS</span>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 active:scale-95"
          aria-label="Open Menu"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Bottom Navigation Bar (Akses cepat menu utama di jempol HP) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden px-2 shadow-lg">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = pathname === menu.href;

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 text-[10px] font-medium transition-all ${
                active ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-blue-100 text-blue-700" : ""
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="truncate">{menu.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ==================== 2. DESKTOP & MOBILE SIDEBAR CONTAINER ==================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 md:static md:z-auto ${
          // Tampilan Mobile (Slide-in)
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${
          // Tampilan Desktop (Collapsed Width)
          collapsed ? "md:w-20" : "md:w-60"
        }`}
      >
        {/* Tombol Toggle Collapse (Hanya Muncul di Desktop) */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden md:flex absolute -right-3 top-6 z-40 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header / Logo */}
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-xs">
              <BookOpen className="text-white" size={20} />
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">
                  Wawasan CMS
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  Content Pipeline
                </p>
              </div>
            )}
          </div>

          {/* Tombol Tutup Drawer khusus Mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <Separator />

        {/* Main Menu Navigasi */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          {(!collapsed || mobileOpen) && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Main Menu
            </p>
          )}

          <nav className="space-y-1">
            {menus.map((menu) => {
              const Icon = menu.icon;
              const active = pathname === menu.href;

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  title={collapsed && !mobileOpen ? menu.title : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                    collapsed && !mobileOpen ? "justify-center" : ""
                  } ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {(!collapsed || mobileOpen) && <span className="truncate">{menu.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator />

        {/* User Profile Footer */}
        <div className="relative p-3" ref={menuRef}>
          <div
            onClick={() => setOpenMenu((prev) => !prev)}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2 transition hover:bg-slate-100 ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
            title={collapsed && !mobileOpen ? profile?.fullName || "Profile" : undefined}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-600 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-slate-800 truncate">
                  {profile?.fullName ?? "Loading..."}
                </h3>
                <p className="text-[10px] text-slate-500 truncate">
                  {roleLabel}
                </p>
              </div>
            )}
          </div>

          {/* Modal Dropdown Logout */}
          {openMenu && (
            <div
              className={`absolute bottom-16 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-all ${
                collapsed && !mobileOpen ? "left-2 w-48" : "left-3 right-3"
              }`}
            >
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}