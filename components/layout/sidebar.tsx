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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Calendar", href: "/calendar", icon: Calendar },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const mobileUserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMobileUserMenuOpen(false);
  }, [pathname]);

  // Handle click outside untuk dropdown menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(false);
      }
      if (
        mobileUserRef.current &&
        !mobileUserRef.current.contains(event.target as Node)
      ) {
        setMobileUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      setMobileUserMenuOpen(false);
      await signOut(auth);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout gagal:", error);
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. MOBILE TOP HEADER                                          */}
      {/* ------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 shadow-xs">
            <BookOpen className="text-white" size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Wawasan CMS
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Avatar User Header Mobile + Pop-up Logout */}
          <div className="relative" ref={mobileUserRef}>
            <button
              onClick={() => setMobileUserMenuOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-blue-600/20 active:scale-95 transition-transform"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-600 text-xs text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Pop-up Logout dari Top Header Mobile */}
            {mobileUserMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {profile?.fullName ?? "User"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{roleLabel}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 mt-1"
                >
                  <LogOut size={16} />
                  Logout / Keluar
                </button>
              </div>
            )}
          </div>

          {/* Hamburger Menu Sidebar */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50/80 text-slate-600 active:bg-slate-100 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Khusus 4 Menu Utama)         */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-t border-slate-200/80 bg-white/80 backdrop-blur-md md:hidden px-3 shadow-lg">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = pathname === menu.href;

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-all ${
                active ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
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

      {/* BACKDROP OVERLAY UNTUK MOBILE DRAWER */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DESKTOP SIDEBAR / MOBILE DRAWER                            */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
          mobileOpen ? "translate-x-0 w-64 md:translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${
          collapsed ? "md:w-20" : "md:w-60"
        }`}
      >
        {/* Toggle Collapse Button (Hanya Desktop) */}
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
                <p className="text-xs text-slate-500 truncate">Content Pipeline</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <Separator />

        {/* Navigation Menu */}
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
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
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

        {/* User Profile Footer (Desktop Sidebar) */}
        <div className="relative p-3" ref={menuRef}>
          <div
            onClick={() => setOpenMenu((prev) => !prev)}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2 transition hover:bg-slate-100 ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-600 text-xs text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-slate-800 truncate">
                  {profile?.fullName ?? "Loading..."}
                </h3>
                <p className="text-[10px] text-slate-500 truncate">{roleLabel}</p>
              </div>
            )}
          </div>

          {openMenu && (
            <div
              className={`absolute bottom-16 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ${
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