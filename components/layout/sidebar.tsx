"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
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

  // State untuk Buka / Tutup Sidebar
  const [collapsed, setCollapsed] = useState(false);

  // State untuk Dropdown User Menu
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

      await signOut(auth);

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout gagal:", error);
    }
  };

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-60"
      }`}
    >
      {/* Tombol Buka/Tutup Sidebar (Toggle Button) */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3 top-6 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header / Logo */}
      <div className={`flex items-center px-4 py-5 ${collapsed ? "justify-center" : "justify-between"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <BookOpen className="text-white" size={20} />
          </div>

          {!collapsed && (
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
      </div>

      <Separator />

      {/* Main Menu Navigasi */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        {!collapsed && (
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
                title={collapsed ? menu.title : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{menu.title}</span>}
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
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? profile?.fullName || "Profile" : undefined}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-blue-600 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
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
              collapsed ? "left-2 w-48" : "left-3 right-3"
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
  );
}