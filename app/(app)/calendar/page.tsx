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

  // Default: Hari ini / Bulan berjalan saat ini
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlatform, setSelectedPlatform] = useState("Semua");

  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // 1. TARIK SEMUA DOKUMEN DARI COLLECTION 'contents'
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "contents"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData: ContentItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          // Ekstraksi Fleksibel untuk Hashtag
          let extractedHashtags: string[] = [];
          const rawTags = data.hashtags || data.hashtag || data.tags || data.tag;
          const captionText = data.caption || data.deskripsi || data.description || "";

          if (Array.isArray(rawTags)) {
            extractedHashtags = rawTags.map((t) => String(t).trim());
          } else if (typeof rawTags === "string" && rawTags.trim() !== "") {
            extractedHashtags = rawTags.split(/[\s,]+/).filter(Boolean);
          } else if (typeof captionText === "string") {
            // Ambil otomatis semua kata berawalan '#' dari caption jika field hashtag kosong
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

  // 2. LOGIKA PENCOCOKAN TANGGAL DIPOSTING
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

  // Helper Style Platform
  const getPlatformStyle = (platform: string) => {
    const p = String(platform).toLowerCase();
    if (p.includes("instagram")) {
      return "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 text-pink-700 border-pink-200/80";
    }
    if (p.includes("tiktok")) {
      return "bg-gradient-to-r from-cyan-500/10 via-slate-900/10 to-rose-500/10 text-cyan-900 border-cyan-200/80";
    }
    return "bg-indigo-500/10 text-indigo-700 border-indigo-200/80";
  };

  const getStatusDot = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "published") return "bg-emerald-500 shadow-emerald-500/40";
    if (s === "approval") return "bg-sky-500 shadow-sky-500/40";
    if (s === "revisi") return "bg-violet-500 shadow-violet-500/40";
    return "bg-amber-500 shadow-amber-500/40";
  };

  const getStatusBadge = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "published") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "approval") return "bg-sky-50 text-sky-700 border-sky-200";
    if (s === "revisi") return "bg-violet-50 text-violet-700 border-violet-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  // Navigasi Bulan
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Grid Kalender
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
    <div className="space-y-3.5 max-w-full text-xs pb-4">
      {/* Header Controls */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 text-white shadow-md shadow-blue-500/20">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 capitalize">{monthName}</h1>
              <p className="text-[10px] font-medium text-slate-500">Jadwal Perencanaan Konten Media Sosial</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all shadow-2xs"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="h-8 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Semua">Semua Platform</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
          </select>
        </div>
      </div>

      {/* Legend Status */}
      <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 font-medium">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Status Konten:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Draft</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Revisi</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Approval</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Published</span>
        </div>
      </div>

      {/* Grid Kalender */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center gap-2 text-slate-600 font-medium">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Memuat Data Firestore...
          </div>
        )}

        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-gradient-to-r from-slate-100/80 via-slate-50 to-indigo-50/30 text-center font-extrabold text-[10px] text-slate-500 uppercase py-2.5">
          <div className="text-rose-500">Min</div>
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div>Sab</div>
        </div>

        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50/30">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[110px] bg-slate-50/40 p-1.5" />;
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
                className={`min-h-[110px] p-1.5 transition-all duration-150 flex flex-col justify-between group hover:bg-blue-50/30 ${
                  isToday ? "bg-blue-50/50" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      isToday
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 group-hover:text-blue-600"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                      {dayEvents.length} Konten
                    </span>
                  )}
                </div>

                {/* List Item Konten di Slot Tanggal */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-none">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedContent(event)}
                      className={`p-1.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer shadow-2xs ${getPlatformStyle(
                        event.platform
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="truncate font-bold text-[9px] text-slate-800">
                          {event.title}
                        </span>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getStatusDot(event.status)}`} />
                      </div>
                      <div className="flex items-center justify-between text-[8px] opacity-80">
                        <span>{event.platform}</span>
                        <span>{event.scheduledTime} WIB</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            
            {/* 1. STATUS & PLATFORM */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${getStatusBadge(selectedContent.status)}`}>
                {selectedContent.status}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Tag className="h-3 w-3" /> {selectedContent.platform}
              </span>
            </div>

            <div className="space-y-3.5 text-slate-700">
              {/* 2. JUDUL */}
              <h2 className="text-sm font-bold text-slate-900 leading-snug">{selectedContent.title}</h2>

              {/* 3. CAPTION */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Caption</span>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/60 max-h-36 overflow-y-auto">
                  <p className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedContent.caption || "Tidak ada caption."}
                  </p>
                </div>
              </div>

              {/* 4. HASHTAG */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hashtag</span>
                {selectedContent.hashtags && selectedContent.hashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {selectedContent.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg"
                      >
                        <Hash className="h-2.5 w-2.5" />
                        {tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Tidak ada hashtag.</p>
                )}
              </div>
            </div>

            {/* Tombol Tutup */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContent(null)}
                className="h-8 text-xs font-semibold rounded-xl border-slate-200"
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