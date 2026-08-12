"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Tag,
  Hash,
  Loader2,
  ExternalLink,
  User,
  Clock,
  X,
  Sparkles,
} from "lucide-react";

// Firebase Imports
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduledDate: any;
  scheduledTime?: string;
  caption?: string;
  hashtags?: string[];
  driveLink?: string;
  authorName?: string;
}

export default function CalendarPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState("Semua");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // 1. Fetch data dari Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "contents"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData: ContentItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          let extractedHashtags: string[] = [];
          const rawTags = data.hashtags || data.hashtag || data.tags || data.tag;
          const captionText = data.caption || data.deskripsi || data.description || "";

          if (Array.isArray(rawTags)) {
            extractedHashtags = rawTags.map((t) => String(t).trim());
          } else if (typeof rawTags === "string" && rawTags.trim() !== "") {
            extractedHashtags = rawTags.split(/[\s,]+/).filter(Boolean);
          } else if (typeof captionText === "string") {
            const matches = captionText.match(/#[a-zA-Z0-9_]+/g);
            if (matches) extractedHashtags = matches;
          }

          return {
            id: docSnap.id,
            title: data.title || data.judul || data.name || data.topic || "Tanpa Judul",
            platform: data.platform || data.media || "Instagram",
            status: data.status || data.state || "Draft",
            scheduledDate:
              data.scheduledDate ||
              data.date ||
              data.tanggal ||
              data.publishDate ||
              data.schedule ||
              data.createdAt,
            scheduledTime: data.scheduledTime || data.time || data.jam || "12:00",
            caption: captionText,
            hashtags: extractedHashtags,
            driveLink: data.driveLink || data.link || data.assetUrl || "",
            authorName: data.authorName || data.author || "Tim Desain",
          };
        });

        setContents(fetchedData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ [FIRESTORE ERROR]:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Pencocokan Tanggal
  const isContentOnDate = (rawDate: any, targetYear: number, targetMonth: number, targetDay: number) => {
    if (!rawDate) return false;

    let dateObj: Date | null = null;

    if (typeof rawDate === "object" && typeof rawDate.toDate === "function") {
      dateObj = rawDate.toDate();
    } else if (rawDate instanceof Date) {
      dateObj = rawDate;
    } else if (typeof rawDate === "string") {
      const cleanStr = rawDate.split("T")[0];
      const parts = cleanStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return y === targetYear && m === targetMonth && d === targetDay;
      }
      dateObj = new Date(rawDate);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      return (
        dateObj.getFullYear() === targetYear &&
        dateObj.getMonth() === targetMonth &&
        dateObj.getDate() === targetDay
      );
    }

    return false;
  };

  // Format Helper
  const formatDisplayDate = (rawDate: any) => {
    if (!rawDate) return "-";
    let dateObj: Date | null = null;
    if (typeof rawDate === "object" && typeof rawDate.toDate === "function") {
      dateObj = rawDate.toDate();
    } else if (rawDate instanceof Date) {
      dateObj = rawDate;
    } else if (typeof rawDate === "string") {
      dateObj = new Date(rawDate);
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return String(rawDate);
  };

  // Style Resolvers
  const getPlatformStyle = (platform: string) => {
    const p = String(platform).toLowerCase();
    if (p.includes("instagram")) {
      return "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-rose-500/10 border-pink-200/80 text-pink-900";
    }
    if (p.includes("tiktok")) {
      return "bg-slate-900/5 border-slate-300/80 text-slate-900";
    }
    return "bg-blue-500/10 border-blue-200/80 text-blue-900";
  };

  const getStatusDot = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "published") return "bg-emerald-500 ring-1 ring-emerald-200";
    if (s === "approval") return "bg-sky-500 ring-1 ring-sky-200";
    if (s === "revisi") return "bg-violet-500 ring-1 ring-violet-200";
    return "bg-amber-500 ring-1 ring-amber-200";
  };

  const getStatusBadge = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "published") return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    if (s === "approval") return "bg-sky-50 text-sky-700 border-sky-200/80";
    if (s === "revisi") return "bg-violet-50 text-violet-700 border-violet-200/80";
    return "bg-amber-50 text-amber-700 border-amber-200/80";
  };

  // Navigasi
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Grid Info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-3 max-w-full text-xs font-sans pb-4">
      {/* HEADER & CONTROL BAR */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md p-3 md:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-slate-900 p-2 text-white shadow-md shadow-slate-900/10">
              <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight capitalize">{monthName}</h1>
              <p className="text-[10px] md:text-[11px] font-medium text-slate-500">Jadwal Perencanaan Konten</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 md:p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-1.5 md:px-2 py-0.5 md:py-1 text-[9px] md:text-[10px] font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
            >
              Hari Ini
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
          </div>
        </div>

        {/* PLATFORM FILTER */}
        <div className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-end overflow-x-auto pb-0.5 md:pb-0">
          {["Semua", "Instagram", "TikTok"].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-2.5 py-1 rounded-lg md:rounded-xl text-[10px] md:text-[11px] font-bold transition-all shrink-0 ${
                selectedPlatform === plat
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* LEGEND STATUS */}
      <div className="rounded-xl border border-slate-200/70 bg-white/60 px-3 py-1.5 md:py-2 shadow-2xs flex flex-wrap items-center justify-between gap-1.5 text-[9px] md:text-[10px] text-slate-600 font-medium">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] md:text-[9px] flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400" /> Status:
        </span>
        <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-500" /> Draft</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-violet-500" /> Revisi</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-sky-500" /> Approval</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500" /> Published</span>
        </div>
      </div>

      {/* GRID KALENDER */}
      <div className="rounded-xl md:rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex items-center justify-center gap-2 text-slate-600 font-medium text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Memuat Data...
          </div>
        )}

        {/* Nama Hari */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/80 text-center font-extrabold text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider py-1.5 md:py-2.5">
          <div className="text-rose-500">Min</div>
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div>Sab</div>
        </div>

        {/* Slot Tanggal */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/30">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[52px] md:min-h-[115px] bg-slate-50/40" />;
            }

            const dayEvents = contents.filter((item) => {
              const matchDate = isContentOnDate(item.scheduledDate, year, month, day);
              const matchPlatform =
                selectedPlatform === "Semua" ||
                String(item.platform).toLowerCase().includes(selectedPlatform.toLowerCase());
              return matchDate && matchPlatform;
            });

            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[52px] md:min-h-[115px] p-0.5 md:p-1.5 transition-all duration-150 flex flex-col justify-between group hover:bg-slate-50/80 ${
                  isToday ? "bg-blue-50/40" : "bg-white"
                }`}
              >
                {/* Header Slot Tanggal */}
                <div className="flex items-center justify-between mb-0.5 md:mb-1.5">
                  <span
                    className={`h-4 w-4 md:h-6 md:w-6 flex items-center justify-center rounded-full text-[9px] md:text-[11px] font-bold ${
                      isToday
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 group-hover:text-blue-600"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[7px] md:text-[9px] font-bold px-1 py-0.2 md:px-1.5 md:py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* List Item Konten */}
                <div className="space-y-0.5 md:space-y-1.5 flex-1 overflow-y-auto max-h-[38px] md:max-h-[90px] pr-0.5 scrollbar-thin">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedContent(event)}
                      className={`p-0.5 md:p-1.5 rounded-md md:rounded-xl border transition-all cursor-pointer shadow-2xs ${getPlatformStyle(
                        event.platform
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-0.5 md:gap-1">
                        <span className="truncate font-semibold text-[8px] md:text-[10px] text-slate-900 leading-none md:leading-tight">
                          {event.title}
                        </span>
                        <span className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full shrink-0 ${getStatusDot(event.status)}`} />
                      </div>
                      <div className="hidden md:flex items-center justify-between text-[8px] text-slate-500 font-medium">
                        <span className="capitalize">{event.platform}</span>
                        <span>{event.scheduledTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP DETAIL KONTEN */}
      {selectedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 md:p-4">
          <div className="w-full max-w-lg rounded-2xl md:rounded-3xl bg-white p-4 md:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
            
            {/* Header Popup */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 md:pb-4 mb-3 md:mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold border ${getStatusBadge(selectedContent.status)}`}>
                    {selectedContent.status}
                  </span>
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Tag className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400" /> {selectedContent.platform}
                  </span>
                </div>
                <h2 className="text-sm md:text-base font-bold text-slate-900 leading-snug">{selectedContent.title}</h2>
              </div>
              <button
                onClick={() => setSelectedContent(null)}
                className="p-1 md:p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 md:space-y-4 text-slate-700">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-slate-100 text-[10px] md:text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>{formatDisplayDate(selectedContent.scheduledDate)} • {selectedContent.scheduledTime} WIB</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>{selectedContent.authorName}</span>
                </div>
              </div>

              {/* Caption */}
              <div>
                <span className="text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Caption
                </span>
                <div className="rounded-xl md:rounded-2xl bg-slate-50 p-2.5 md:p-3 border border-slate-200/60 max-h-32 md:max-h-40 overflow-y-auto">
                  <p className="text-[10px] md:text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
                    {selectedContent.caption || "Tidak ada caption."}
                  </p>
                </div>
              </div>

              {/* Hashtag */}
              <div>
                <span className="text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Hashtags
                </span>
                {selectedContent.hashtags && selectedContent.hashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {selectedContent.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-0.5 text-[9px] md:text-[10px] font-semibold text-blue-600 bg-blue-50/80 border border-blue-100 px-1.5 py-0.5 rounded-md"
                      >
                        <Hash className="h-2 w-2 text-blue-400" />
                        {tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] md:text-[10px] text-slate-400 italic">Tidak ada hashtag.</p>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedContent.driveLink ? (
                <a
                  href={selectedContent.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Buka Asset Drive
                </a>
              ) : (
                <span className="text-[9px] md:text-[10px] text-slate-400 italic">Tidak ada link asset</span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContent(null)}
                className="h-7 md:h-8 px-3 md:px-4 text-[11px] md:text-xs font-semibold rounded-lg md:rounded-xl border-slate-200 hover:bg-slate-50"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}