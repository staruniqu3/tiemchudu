import { useState, useEffect } from "react";
import { useListShippingUpdates } from "@workspace/api-client-react";
import { Truck, Package, CheckCircle, Clock, ChevronRight, X, MapPin, Calendar, Search, Hash, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  dot: string;
  gradient: string;
}> = {
  web_order: {
    label: "Web trả hàng",
    icon: <Clock size={16} />,
    color: "text-sky-600",
    bg: "bg-sky-50",
    dot: "bg-sky-400",
    gradient: "from-sky-400 to-cyan-500",
  },
  warehouse_origin: {
    label: "Đã về kho tại nước sở tại",
    icon: <Package size={16} />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    dot: "bg-indigo-400",
    gradient: "from-indigo-400 to-blue-500",
  },
  warehouse_vn: {
    label: "Về kho Việt",
    icon: <MapPin size={16} />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-purple-600",
  },
  sorting: {
    label: "Phân loại hàng",
    icon: <Package size={16} />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    dot: "bg-orange-400",
    gradient: "from-orange-400 to-amber-500",
  },
  preparing: {
    label: "Chuẩn bị giao",
    icon: <Clock size={16} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
    gradient: "from-amber-400 to-orange-500",
  },
  in_transit: {
    label: "Đang giao",
    icon: <Truck size={16} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-500",
  },
  arrived: {
    label: "Đã về kho",
    icon: <Package size={16} />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-purple-600",
  },
  delivered: {
    label: "Đã giao",
    icon: <CheckCircle size={16} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
  },
  returned: {
    label: "Trả đơn toàn bộ",
    icon: <CheckCircle size={16} />,
    color: "text-teal-600",
    bg: "bg-teal-50",
    dot: "bg-teal-500",
    gradient: "from-teal-500 to-emerald-600",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface SheetShipping {
  customerCode: string;
  name: string;
  trackingCode: string;
  carrier: string;
  status: string;
  shippingFee: string;
}

type Update = {
  id: number;
  title: string;
  description: string;
  status: string;
  estimatedDate: string | null;
  createdAt: string;
};

function normalizeSheetStatus(status: string): { label: string; dot: string; bg: string; color: string; gradient: string } {
  const s = status.toLowerCase();
  if (s.includes("đã giao") || s.includes("giao thành công")) {
    return { label: status, dot: "bg-emerald-500", bg: "bg-emerald-50", color: "text-emerald-700", gradient: "from-emerald-500 to-teal-500" };
  }
  if (s.includes("đang giao") || s.includes("đang vận chuyển") || s.includes("đang chuyển")) {
    return { label: status, dot: "bg-blue-500", bg: "bg-blue-50", color: "text-blue-700", gradient: "from-blue-500 to-indigo-500" };
  }
  if (s.includes("đã gửi") || s.includes("đvvc") || s.includes("lấy hàng")) {
    return { label: status, dot: "bg-violet-500", bg: "bg-violet-50", color: "text-violet-700", gradient: "from-violet-500 to-purple-600" };
  }
  if (s.includes("về kho") || s.includes("chờ")) {
    return { label: status, dot: "bg-amber-500", bg: "bg-amber-50", color: "text-amber-700", gradient: "from-amber-400 to-orange-500" };
  }
  return { label: status, dot: "bg-gray-400", bg: "bg-gray-50", color: "text-gray-600", gradient: "from-gray-400 to-gray-500" };
}

function ShippingModal({ update, onClose }: { update: Update; onClose: () => void }) {
  const config = statusConfig[update.status] ?? statusConfig.preparing;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${config.gradient} p-5 pt-6`}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">{config.icon}</div>
            <div>
              <p className="text-xs font-medium opacity-80">{config.label}</p>
              <h3 className="text-lg font-bold leading-tight">{update.title}</h3>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">{update.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Calendar size={13} />
                <span className="text-[11px] font-semibold">Ngày đăng</span>
              </div>
              <p className="text-sm font-bold">{formatDate(update.createdAt)}</p>
            </div>
            {update.estimatedDate && (
              <div className="bg-primary/10 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-primary mb-1">
                  <MapPin size={13} />
                  <span className="text-[11px] font-semibold">Dự kiến</span>
                </div>
                <p className="text-sm font-bold text-primary">{update.estimatedDate}</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm">Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default function ShippingPage() {
  const { data: updates, isLoading: updatesLoading } = useListShippingUpdates();
  const [selected, setSelected] = useState<Update | null>(null);
  const [sheetData, setSheetData] = useState<SheetShipping[]>([]);
  const [sheetLoading, setSheetLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    const base = getBaseUrl();
    fetch(`${base}/api/sheets/all-shipping`)
      .then((r) => r.json())
      .then((data) => { setSheetData(Array.isArray(data) ? data : []); setSheetLoading(false); })
      .catch(() => setSheetLoading(false));
  }, []);

  const sorted = updates ? [...updates].reverse() : [];

  const carriers = [...new Set(sheetData.map((s) => s.carrier).filter(Boolean))];

  const filteredSheet = sheetData.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.trackingCode.toLowerCase().includes(q) ||
      s.customerCode.toLowerCase().includes(q);
    const matchCarrier = activeFilter === "all" || s.carrier === activeFilter;
    return matchSearch && matchCarrier;
  });

  const totalTracking = sheetData.length;
  const deliveredCount = sheetData.filter((s) => s.status.toLowerCase().includes("đã giao")).length;

  return (
    <div className="min-h-screen bg-background">
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <div className="hero-gradient px-4 pt-10 pb-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Theo Dõi Vận Chuyển</h1>
              <p className="text-xs opacity-60 mt-0.5">Cập nhật theo Google Sheet</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-black leading-none">{totalTracking}</p>
              <p className="text-[9px] opacity-70 font-semibold">Tổng</p>
            </div>
            <div className="bg-emerald-400/25 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-black leading-none">{deliveredCount}</p>
              <p className="text-[9px] opacity-70 font-semibold">Đã giao</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="w-full bg-white/15 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Tìm tên, mã đơn, mã KH..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {carriers.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${activeFilter === "all" ? "bg-white text-foreground" : "bg-white/15 text-white/80"}`}
            >
              Tất cả
            </button>
            {carriers.map((c) => (
              <button
                key={c}
                onClick={() => setActiveFilter(c)}
                className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${activeFilter === c ? "bg-white text-foreground" : "bg-white/15 text-white/80"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4 -mt-2 space-y-5 pb-28">

        {/* Google Sheet tracking section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hash size={14} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Mã vận đơn</h2>
            <Badge variant="secondary" className="text-[10px]">theo dõi vận chuyển</Badge>
            {!sheetLoading && <span className="text-[10px] text-muted-foreground ml-auto">{filteredSheet.length} mã</span>}
          </div>

          {sheetLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          )}

          {!sheetLoading && filteredSheet.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Truck size={28} strokeWidth={1.2} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {sheetData.length === 0 ? "Chưa có mã vận đơn nào" : "Không tìm thấy kết quả"}
              </p>
            </div>
          )}

          {!sheetLoading && filteredSheet.length > 0 && (
            <div className="space-y-2">
              {filteredSheet.map((s, i) => {
                const cfg = normalizeSheetStatus(s.status);
                return (
                  <div key={i} className={`bg-card border border-border rounded-2xl p-4 ${cfg.bg.replace("bg-", "border-l-4 border-l-").replace("50", "400")}`}
                    style={{ borderLeftColor: "" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-base font-extrabold font-mono tracking-wide">{s.customerCode}</span>
                          </div>
                          <p className={`text-xs font-bold font-mono ${cfg.color}`}>{s.trackingCode}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {s.carrier && (
                              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-semibold">{s.carrier}</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                            {s.shippingFee && (
                              <span className="text-[10px] text-muted-foreground">{s.shippingFee}đ</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://tracking.ghn.dev/?order_id=${s.trackingCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 w-8 h-8 bg-muted rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={13} className="text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DB shipping announcements */}
        {(updatesLoading || sorted.length > 0) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck size={14} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Thông báo lô hàng</h2>
            </div>

            {updatesLoading && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            )}

            <div className="space-y-2">
              {sorted.map((update, idx) => {
                const config = statusConfig[update.status] ?? statusConfig.preparing;
                const isFirst = idx === 0;
                return (
                  <button
                    key={update.id}
                    className={`w-full bg-card border border-border rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${isFirst ? "ring-2 ring-primary/20" : ""}`}
                    onClick={() => setSelected(update as Update)}
                    data-testid={`shipping-card-${update.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {isFirst && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">MỚI NHẤT</span>}
                          <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="font-bold text-sm truncate">{update.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{update.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{formatDate(update.createdAt)}</span>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </div>
                    </div>
                    {update.estimatedDate && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
                        <MapPin size={11} className="text-primary" />
                        <span className="text-xs text-muted-foreground">Dự kiến:</span>
                        <span className="text-xs font-bold text-primary">{update.estimatedDate}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selected && <ShippingModal update={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
