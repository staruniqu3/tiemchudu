import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, X, Star, Package, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PreorderItem {
  id: number;
  title: string;
  description: string | null;
  startDate: string | null;
  deadline: string | null;
  pickupDate: string | null;
  imageUrl: string | null;
  artist: string | null;
  isActive: boolean;
  createdAt: string;
}

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

const DAY_PX = 52;

const ARTIST_COLORS: Record<string, { fill: string; bg: string; text: string }> = {
  "aespa":        { fill: "#00BFA5", bg: "rgba(0,191,165,0.15)",   text: "#fff" },
  "newjeans":     { fill: "#60A5FA", bg: "rgba(96,165,250,0.15)",  text: "#fff" },
  "nj":           { fill: "#60A5FA", bg: "rgba(96,165,250,0.15)",  text: "#fff" },
  "bts":          { fill: "#6D4CA5", bg: "rgba(109,76,165,0.18)",  text: "#fff" },
  "blackpink":    { fill: "#E91E8C", bg: "rgba(233,30,140,0.15)",  text: "#fff" },
  "seventeen":    { fill: "#3B82F6", bg: "rgba(59,130,246,0.15)",  text: "#fff" },
  "svt":          { fill: "#3B82F6", bg: "rgba(59,130,246,0.15)",  text: "#fff" },
  "straykids":    { fill: "#F59E0B", bg: "rgba(245,158,11,0.18)",  text: "#fff" },
  "stray kids":   { fill: "#F59E0B", bg: "rgba(245,158,11,0.18)",  text: "#fff" },
  "skz":          { fill: "#F59E0B", bg: "rgba(245,158,11,0.18)",  text: "#fff" },
  "twice":        { fill: "#F43F5E", bg: "rgba(244,63,94,0.15)",   text: "#fff" },
  "ive":          { fill: "#8B5CF6", bg: "rgba(139,92,246,0.15)",  text: "#fff" },
  "itzy":         { fill: "#F97316", bg: "rgba(249,115,22,0.15)",  text: "#fff" },
  "nct":          { fill: "#10B981", bg: "rgba(16,185,129,0.15)",  text: "#fff" },
  "nct127":       { fill: "#EF4444", bg: "rgba(239,68,68,0.15)",   text: "#fff" },
  "nctdream":     { fill: "#10B981", bg: "rgba(16,185,129,0.15)",  text: "#fff" },
  "nct dream":    { fill: "#10B981", bg: "rgba(16,185,129,0.15)",  text: "#fff" },
  "wayv":         { fill: "#0EA5E9", bg: "rgba(14,165,233,0.15)",  text: "#fff" },
  "exo":          { fill: "#DC2626", bg: "rgba(220,38,38,0.15)",   text: "#fff" },
  "shinee":       { fill: "#06B6D4", bg: "rgba(6,182,212,0.15)",   text: "#fff" },
  "redvelvet":    { fill: "#BE123C", bg: "rgba(190,18,60,0.15)",   text: "#fff" },
  "red velvet":   { fill: "#BE123C", bg: "rgba(190,18,60,0.15)",   text: "#fff" },
  "rv":           { fill: "#BE123C", bg: "rgba(190,18,60,0.15)",   text: "#fff" },
  "got7":         { fill: "#16A34A", bg: "rgba(22,163,74,0.15)",   text: "#fff" },
  "gidle":        { fill: "#A855F7", bg: "rgba(168,85,247,0.18)",  text: "#fff" },
  "(g)i-dle":     { fill: "#A855F7", bg: "rgba(168,85,247,0.18)",  text: "#fff" },
  "lesserafim":   { fill: "#E11D48", bg: "rgba(225,29,72,0.15)",   text: "#fff" },
  "le sserafim":  { fill: "#E11D48", bg: "rgba(225,29,72,0.15)",   text: "#fff" },
  "txt":          { fill: "#7C3AED", bg: "rgba(124,58,237,0.18)",  text: "#fff" },
  "tomorrow x together": { fill: "#7C3AED", bg: "rgba(124,58,237,0.18)", text: "#fff" },
  "enhypen":      { fill: "#0F766E", bg: "rgba(15,118,110,0.18)",  text: "#fff" },
  "riize":        { fill: "#2563EB", bg: "rgba(37,99,235,0.15)",   text: "#fff" },
  "illit":        { fill: "#EC4899", bg: "rgba(236,72,153,0.18)",  text: "#fff" },
  "xdinary heroes": { fill: "#DC2626", bg: "rgba(220,38,38,0.15)", text: "#fff" },
  "day6":         { fill: "#0891B2", bg: "rgba(8,145,178,0.18)",   text: "#fff" },
};

function getArtistColor(artist: string | null) {
  if (!artist) return null;
  const key = artist.toLowerCase().replace(/\s+/g, " ").trim();
  return (
    ARTIST_COLORS[key] ??
    ARTIST_COLORS[key.replace(/\s/g, "")] ??
    null
  );
}

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

const MONTH_LABELS_VI = ["Th.1", "Th.2", "Th.3", "Th.4", "Th.5", "Th.6",
  "Th.7", "Th.8", "Th.9", "Th.10", "Th.11", "Th.12"];

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = startOfDay(new Date(deadline));
  const now = startOfDay(new Date());
  return diffDays(d, now);
}

function UrgencyBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Kết thúc</span>;
  if (days === 0) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">HÔM NAY</span>;
  if (days <= 3) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Còn {days}d</span>;
  if (days <= 7) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">Còn {days}d</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Còn {days}d</span>;
}

function PreorderModal({ item, onClose }: { item: PreorderItem; onClose: () => void }) {
  const days = getDaysLeft(item.deadline);
  const ended = days !== null && days < 0;
  const start = item.startDate ? startOfDay(new Date(item.startDate)) : startOfDay(new Date(item.createdAt));
  const deadline = item.deadline ? startOfDay(new Date(item.deadline)) : null;
  const pickupDay = item.pickupDate ? startOfDay(new Date(item.pickupDate)) : null;
  const today = startOfDay(new Date());
  const totalDays = deadline ? diffDays(deadline, start) : null;
  const elapsed = deadline ? Math.min(diffDays(today, start), totalDays ?? 0) : null;
  const progress = totalDays && elapsed !== null && totalDays > 0
    ? Math.max(0, Math.min(100, (elapsed / totalDays) * 100))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hero-gradient p-5 pt-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X size={16} />
          </button>
          {item.artist && (
            <div className="flex items-center gap-1.5 mb-1">
              <Star size={12} className="text-pink-300" fill="currentColor" />
              <span className="text-xs font-bold text-pink-200">{item.artist}</span>
            </div>
          )}
          <h3 className="text-xl font-black leading-tight pr-8">{item.title}</h3>
        </div>

        <div className="p-5 space-y-4">
          {item.description && (
            <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
          )}

          {deadline && progress !== null && (
            <div className={`rounded-2xl p-4 ${ended ? "bg-muted" : days !== null && days <= 3 ? "bg-red-50" : "bg-primary/5"}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Tiến độ deadline</span>
                <UrgencyBadge days={days} />
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${ended ? "bg-gray-400" : days !== null && days <= 3 ? "bg-red-400" : "bg-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>Bắt đầu: {start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
                <span className={`font-bold ${ended ? "text-gray-400" : days !== null && days <= 3 ? "text-red-500" : "text-primary"}`}>
                  Deadline: {deadline.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          )}

          {pickupDay && (
            <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <Package size={14} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Lịch Pickup</p>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">
                  {pickupDay.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreorderPage() {
  const [items, setItems] = useState<PreorderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<PreorderItem | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base = getBaseUrl();
    setIsLoading(true);
    fetch(`${base}/api/preorder-schedule`)
      .then((r) => r.json())
      .then((data) => { setItems(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = items
    .filter((i) => filter === "all" || i.isActive)
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const today = startOfDay(new Date());

  const rangeStart = (() => {
    const dates = items
      .map((i) => startOfDay(new Date(i.createdAt)))
      .filter(Boolean);
    const earliest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : today;
    return addDays(earliest < addDays(today, -14) ? earliest : addDays(today, -14), -3);
  })();

  const rangeEnd = (() => {
    const dates = items
      .filter((i) => i.deadline)
      .map((i) => startOfDay(new Date(i.deadline!)));
    const latest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : today;
    return addDays(latest > addDays(today, 30) ? latest : addDays(today, 30), 5);
  })();

  const totalDays = diffDays(rangeEnd, rangeStart) + 1;
  const todayOffset = diffDays(today, rangeStart);

  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));

  useEffect(() => {
    if (scrollRef.current && todayOffset >= 0) {
      const scrollTo = todayOffset * DAY_PX - scrollRef.current.clientWidth / 2 + DAY_PX / 2;
      scrollRef.current.scrollLeft = Math.max(0, scrollTo);
    }
  }, [isLoading, todayOffset]);

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="hero-gradient px-4 pt-10 pb-5 text-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">Lịch Pre-order</h1>
              <p className="text-xs opacity-60 mt-0.5">Theo dõi deadline đặt hàng</p>
            </div>
          </div>
          <div className="bg-white/15 rounded-2xl px-3 py-1.5 text-center min-w-[52px]">
            <p className="text-xl font-black leading-none">{activeCount}</p>
            <p className="text-[9px] opacity-70 font-semibold mt-0.5">Đang mở</p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {(["active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f ? "bg-white text-foreground shadow" : "bg-white/15 text-white/80"
              }`}
            >
              {f === "active" ? "Đang mở" : "Tất cả"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-16 text-muted-foreground gap-3 px-4">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
            <Package size={36} strokeWidth={1.2} />
          </div>
          <p className="font-bold text-foreground">Chưa có pre-order</p>
          <p className="text-sm text-center">Shop sẽ thông báo khi có goods mới</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          <div
            ref={scrollRef}
            className="overflow-x-auto shrink-0 bg-card border-b border-border"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div style={{ width: totalDays * DAY_PX, position: "relative", minWidth: "100%" }}>

              <div className="flex border-b border-border/50" style={{ height: 36 }}>
                {days.map((d, i) => {
                  const isToday = diffDays(d, today) === 0;
                  const isFirstOfMonth = d.getDate() === 1;
                  return (
                    <div
                      key={i}
                      style={{ width: DAY_PX, flexShrink: 0 }}
                      className={`flex flex-col items-center justify-center border-r border-border/30 relative text-[10px] font-semibold transition-colors
                        ${isToday ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                    >
                      {isFirstOfMonth && (
                        <span className="text-[8px] font-bold text-primary/60 leading-none -mt-0.5">
                          {MONTH_LABELS_VI[d.getMonth()]}
                        </span>
                      )}
                      <span className={`leading-none ${isToday ? "font-black text-primary" : ""}`}>
                        {isToday ? "●" : d.getDate()}
                      </span>
                      {!isFirstOfMonth && !isToday && (
                        <span className="text-[8px] opacity-50 leading-none">
                          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="relative" style={{ paddingBottom: 4 }}>
                {/* Today vertical line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10 pointer-events-none"
                  style={{ left: todayOffset * DAY_PX + DAY_PX / 2 - 1 }}
                />

                {filtered.map((item, idx) => {
                  const itemStart = item.startDate ? startOfDay(new Date(item.startDate)) : startOfDay(new Date(item.createdAt));
                  const itemEnd = item.deadline ? startOfDay(new Date(item.deadline)) : addDays(today, 30);
                  const startOffset = diffDays(itemStart, rangeStart);
                  const durationDays = Math.max(diffDays(itemEnd, itemStart) + 1, 1);
                  const elapsed = Math.max(0, Math.min(durationDays, diffDays(today, itemStart) + 1));
                  const pct = durationDays > 0 ? (elapsed / durationDays) * 100 : 100;
                  const days_ = getDaysLeft(item.deadline);
                  const ended = days_ !== null && days_ < 0;
                  const urgent = days_ !== null && days_ >= 0 && days_ <= 3;
                  const ac = getArtistColor(item.artist);

                  // Pickup segment
                  const pickupStart = item.pickupDate ? startOfDay(new Date(item.pickupDate)) : null;
                  const pickupOffset = pickupStart ? diffDays(pickupStart, rangeStart) : null;

                  const barBg = ended
                    ? "rgba(200,200,200,0.25)"
                    : urgent
                      ? "rgba(239,68,68,0.15)"
                      : ac ? ac.bg : "rgba(var(--primary),0.10)";
                  const barFill = ended
                    ? "#9CA3AF"
                    : urgent
                      ? "#F87171"
                      : ac ? ac.fill : "hsl(var(--primary))";
                  const barBorder = ended
                    ? "rgba(156,163,175,0.4)"
                    : urgent
                      ? "rgba(239,68,68,0.3)"
                      : ac ? `${ac.fill}55` : "hsl(var(--primary)/0.25)";

                  return (
                    <div
                      key={item.id}
                      className="relative flex items-center"
                      style={{ height: 44, marginTop: idx === 0 ? 6 : 2 }}
                    >
                      {/* PO bar */}
                      <div
                        className="absolute inset-y-1 rounded-full overflow-hidden cursor-pointer shadow-sm group"
                        style={{
                          left: startOffset * DAY_PX + 4,
                          width: Math.max(durationDays * DAY_PX - 8, DAY_PX - 4),
                        }}
                        onClick={() => setSelected(item)}
                      >
                        <div
                          className="h-full w-full rounded-full border"
                          style={{ background: barBg, borderColor: barBorder }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: barFill }}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center px-3 gap-2 min-w-0">
                          {item.artist && (
                            <span
                              className="text-[9px] font-black shrink-0 drop-shadow"
                              style={{ color: ended ? "#9CA3AF" : urgent ? "#B91C1C" : "#fff" }}
                            >
                              {item.artist}
                            </span>
                          )}
                          <span
                            className="text-[10px] font-bold truncate drop-shadow"
                            style={{ color: ended ? "#9CA3AF" : "#fff" }}
                          >
                            {item.title}
                          </span>
                        </div>
                      </div>
                      {/* Pickup segment marker */}
                      {pickupOffset !== null && (
                        <div
                          className="absolute flex flex-col items-center cursor-pointer z-20"
                          style={{ left: pickupOffset * DAY_PX + DAY_PX / 2 - 9, top: 2 }}
                          onClick={() => setSelected(item)}
                          title={`Pickup: ${item.pickupDate}`}
                        >
                          <div
                            className="w-[18px] h-[18px] rotate-45 border-2 shadow"
                            style={{
                              background: ac ? ac.fill : "hsl(var(--primary))",
                              borderColor: "#fff",
                            }}
                          />
                          <span className="text-[7px] font-black mt-0.5 whitespace-nowrap" style={{ color: ac ? ac.fill : "hsl(var(--primary))" }}>
                            Pickup
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">
              Chi tiết đơn pre-order
            </p>
            {filtered.map((item) => {
              const days_ = getDaysLeft(item.deadline);
              const ended = days_ !== null && days_ < 0;
              const urgent = days_ !== null && days_ >= 0 && days_ <= 3;
              const itemStart = item.startDate ? startOfDay(new Date(item.startDate)) : startOfDay(new Date(item.createdAt));
              const itemEnd = item.deadline ? startOfDay(new Date(item.deadline)) : null;
              const totalD = itemEnd ? diffDays(itemEnd, itemStart) : null;
              const elapsedD = itemEnd ? Math.max(0, Math.min(totalD ?? 0, diffDays(today, itemStart) + 1)) : null;
              const pct = totalD && elapsedD !== null && totalD > 0
                ? Math.min(100, (elapsedD / totalD) * 100)
                : null;
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-card border rounded-2xl overflow-hidden shadow-sm transition-all ${
                    urgent ? "border-red-200" : ended ? "border-border opacity-60" : "border-border"
                  }`}
                  data-testid={`preorder-card-${item.id}`}
                >
                  <button
                    className="w-full p-4 text-left flex items-start gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                      ended ? "bg-gray-100" : urgent ? "bg-red-100" : "bg-primary/10"
                    }`}>
                      <Calendar size={18} className={ended ? "text-gray-400" : urgent ? "text-red-500" : "text-primary"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {item.artist && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.artist}</span>
                        )}
                        <UrgencyBadge days={days_} />
                      </div>
                      <p className="font-bold text-sm leading-snug">{item.title}</p>

                      {pct !== null && (
                        <div className="mt-2">
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                ended ? "bg-gray-300" : urgent ? "bg-red-400" : "bg-primary"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                            <span>{itemStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
                            {itemEnd && (
                              <span className={urgent ? "text-red-500 font-bold" : ""}>
                                {itemEnd.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 mt-1">
                      {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (item.description || item.startDate || item.deadline || item.pickupDate) && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 bg-muted/30">
                      {item.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      )}
                      {item.startDate && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock size={12} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Bắt đầu PO:</span>
                          <span className="font-bold text-foreground">
                            {new Date(item.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {item.deadline && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock size={12} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Deadline PO:</span>
                          <span className={`font-bold ${urgent ? "text-red-500" : "text-foreground"}`}>
                            {new Date(item.deadline).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {item.pickupDate && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Package size={12} className="text-emerald-500" />
                          <span className="text-muted-foreground">Lịch pickup:</span>
                          <span className="font-bold text-emerald-600">
                            {new Date(item.pickupDate).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {selected && <PreorderModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
