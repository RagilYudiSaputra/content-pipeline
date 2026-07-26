"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface NotificationItem {
  id: string;
  title: string;
  platform: string;
  createdAt: string;
}

export default function Navbar() {
  const pathname = usePathname();

  // State Notifikasi
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageConfig: Record<
    string,
    {
      title: string;
      description: string;
    }
  > = {
    "/dashboard": {
      title: "Dashboard",
      description: "Manage your content publishing workflow.",
    },
    "/content": {
      title: "Content",
      description: "Create, edit, and manage your publishing content.",
    },
    "/categories": {
      title: "Categories",
      description: "Organize and manage your content categories.",
    },
    "/calendar": {
      title: "Content Calendar",
      description: "Plan and schedule your publishing activities.",
    },
    "/analytics": {
      title: "Analytics",
      description: "Track content performance and publishing insights.",
    },
    "/media": {
      title: "Media Library",
      description: "Manage images, covers, and other media assets.",
    },
    "/settings": {
      title: "Settings",
      description: "Configure your application preferences.",
    },
  };

  const currentPage = pageConfig[pathname] ?? {
    title: "Dashboard",
    description: "Manage your content publishing workflow.",
  };

  // Mendengarkan data konten baru dari Firebase secara Realtime
  useEffect(() => {
    const q = query(
      collection(db, "contents"),
      orderBy("createdDate", "desc"),
      limit(5)
    );

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: NotificationItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const dateObj = data.createdDate?.toDate
          ? data.createdDate.toDate()
          : new Date();

        return {
          id: docSnap.id,
          title: data.title || "Konten Baru",
          platform: data.platform || "Instagram",
          createdAt: dateObj.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });

      setNotifications(items);

      // Jika ada perubahan data setelah load pertama, tambahkan counter unread
      if (!isInitialLoad && !snapshot.empty) {
        setUnreadCount((prev) => prev + 1);
      }
      isInitialLoad = false;
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown notifikasi jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setOpenNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/70 px-6 backdrop-blur-md transition-all">
      {/* Left Title */}
      <div>
        <h1 className="text-base font-bold tracking-tight text-slate-800">
          {currentPage.title}
        </h1>
        <p className="text-[11px] font-medium text-slate-500 line-clamp-1">
          {currentPage.description}
        </p>
      </div>

      {/* Right Actions */}
      <div className="relative flex items-center gap-2" ref={notifRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setOpenNotif((prev) => !prev);
            handleMarkAsRead();
          }}
          className="relative h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors"
          title="Notifikasi"
        >
          <Bell size={18} />

          {/* Badge Titik Merah Notifikasi */}
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
            </span>
          )}
        </Button>

        {/* Dropdown Notifikasi Konten Baru */}
        {openNotif && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-lg transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  Notifikasi Konten
                </h3>
              </div>
              <button
                onClick={() => setOpenNotif(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
              {notifications.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Belum ada notifikasi.
                </p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 p-2.5 hover:bg-slate-50/80 rounded-xl transition-colors"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Bell size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        Konten baru dibuat: &quot;{item.title}&quot;
                      </p>
                      <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{item.platform}</span>
                        <span>{item.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-slate-100 p-2 text-center bg-slate-50/50 rounded-b-2xl">
                <button
                  onClick={() => setOpenNotif(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  <Check size={12} />
                  Tutup Notifikasi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}