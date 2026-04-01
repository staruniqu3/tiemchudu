import { useState } from "react";
import {
  Star, Gift, Package, Search, Trophy, ShoppingBag, Truck, Phone,
  ChevronDown, ChevronUp, Ticket, Calendar, MapPin, ExternalLink, Hash, Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

interface MemberProfile {
  stt: string;
  customerCode: string;
  name: string;
  phone: string;
  birthday: string;
  address: string;
  points: number;
  tier: string;
  yearPoints: number;
  redeemedPoints: number;
  vouchersGranted: number;
  vouchersUsed: number;
  vouchersRemaining: number;
  facebookName: string;
  facebookLink: string;
}

interface MemberShipping {
  customerCode: string;
  trackingCode: string;
  carrier: string;
  status: string;
  shippingFee: string;
}

interface SheetOrder {
  timestamp: string;
  name: string;
  phone: string;
  memberStatus: string;
  address: string;
  products: string;
  totalPrice: string;
  shippingMethod: string;
  notes: string;
}

const ELITE_TIERS = ["infinite", "solstice", "patron", "voyager"];
const DRAGON_TIERS = ["infinite", "solstice"];
const PHOENIX_TIERS = ["patron", "voyager"];

const tierConfig: Record<string, {
  label: string;
  emoji: string;
  gradient: string;
  textColor: string;
  bg: string;
  cardStyle?: string;
  elite?: boolean;
  benefits?: string[];
}> = {
  "newcomer": {
    label: "Newcomer",
    emoji: "🌸",
    gradient: "from-pink-400 via-rose-400 to-pink-500",
    textColor: "text-pink-50",
    bg: "bg-pink-100 text-pink-700",
    cardStyle: "bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500",
    benefits: ["Tích điểm mỗi đơn", "Voucher sinh nhật", "Thông báo pre-order"],
  },
  "newcomers": {
    label: "Newcomer",
    emoji: "🌸",
    gradient: "from-pink-400 via-rose-400 to-pink-500",
    textColor: "text-pink-50",
    bg: "bg-pink-100 text-pink-700",
    cardStyle: "bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500",
    benefits: ["Tích điểm mỗi đơn", "Voucher sinh nhật", "Thông báo pre-order"],
  },
  "friend of store": {
    label: "Friend of Store",
    emoji: "🌿",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    textColor: "text-emerald-50",
    bg: "bg-emerald-100 text-emerald-700",
    cardStyle: "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500",
    benefits: ["Tích điểm x1.2", "Voucher ưu đãi", "Ưu tiên pre-order", "Quà sinh nhật"],
  },
  "muses": {
    label: "Muses",
    emoji: "🔮",
    gradient: "from-violet-600 via-purple-600 to-indigo-500",
    textColor: "text-violet-50",
    bg: "bg-violet-100 text-violet-700",
    cardStyle: "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-500",
    benefits: ["Tích điểm x1.5", "Freeship nội thành", "Voucher đặc biệt", "Early access"],
  },
  "dreamer": {
    label: "Dreamer",
    emoji: "🩵",
    gradient: "from-sky-400 via-cyan-400 to-blue-400",
    textColor: "text-sky-50",
    bg: "bg-sky-100 text-sky-700",
    cardStyle: "bg-gradient-to-br from-sky-400 via-cyan-400 to-blue-400",
    benefits: ["Tích điểm x2", "Freeship toàn quốc", "Quà tặng kèm", "VIP pre-order"],
  },
  "ruby": {
    label: "Ruby",
    emoji: "🥂",
    gradient: "from-[#8b0000] via-[#c8435a] to-[#e8c4a0]",
    textColor: "text-[#fff0f0]",
    bg: "bg-red-100 text-red-800",
    cardStyle: "bg-gradient-to-br from-[#8b0000] via-[#c8435a] to-[#e8c4a0]",
    benefits: ["Tích điểm x2.5", "Freeship ưu tiên", "Quà sinh nhật cao cấp", "Exclusive items", "Giảm giá đặc biệt"],
  },
  "platinum": {
    label: "Platinum",
    emoji: "🩶",
    gradient: "from-slate-400 via-gray-400 to-slate-500",
    textColor: "text-slate-50",
    bg: "bg-slate-100 text-slate-600",
    cardStyle: "bg-gradient-to-br from-slate-400 via-gray-400 to-slate-500",
    benefits: ["Tích điểm x3", "Freeship miễn phí", "Exclusive items", "Personal shopping", "Invitation sự kiện"],
  },
  "priviledged": {
    label: "Priviledged",
    emoji: "🖤",
    gradient: "from-gray-900 via-gray-800 to-gray-900",
    textColor: "text-gray-100",
    bg: "bg-gray-900 text-gray-100",
    cardStyle: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
    benefits: ["Tất cả quyền lợi Platinum", "Ưu tiên tuyệt đối", "Limited edition access", "Concierge service"],
  },
  "privileged": {
    label: "Priviledged",
    emoji: "🖤",
    gradient: "from-gray-900 via-gray-800 to-gray-900",
    textColor: "text-gray-100",
    bg: "bg-gray-900 text-gray-100",
    cardStyle: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
    benefits: ["Tất cả quyền lợi Platinum", "Ưu tiên tuyệt đối", "Limited edition access", "Concierge service"],
  },
  "infinite": {
    label: "Infinite",
    emoji: "🐉",
    gradient: "from-gray-950 via-gray-900 to-black",
    textColor: "text-amber-200",
    bg: "bg-black text-amber-300",
    cardStyle: "tier-card-dragon",
    elite: true,
  },
  "solstice": {
    label: "Solstice",
    emoji: "🐲",
    gradient: "from-gray-950 via-gray-900 to-black",
    textColor: "text-amber-200",
    bg: "bg-black text-amber-300",
    cardStyle: "tier-card-dragon",
    elite: true,
  },
  "patron": {
    label: "Patron",
    emoji: "🦅",
    gradient: "from-gray-950 via-gray-900 to-black",
    textColor: "text-rose-200",
    bg: "bg-black text-rose-300",
    cardStyle: "tier-card-phoenix",
    elite: true,
  },
  "voyager": {
    label: "Voyager",
    emoji: "🦚",
    gradient: "from-gray-950 via-gray-900 to-black",
    textColor: "text-rose-200",
    bg: "bg-black text-rose-300",
    cardStyle: "tier-card-phoenix",
    elite: true,
  },
};

function getTierConfig(tier: string) {
  const key = tier.toLowerCase().trim();
  return tierConfig[key] ?? {
    label: tier,
    emoji: "⭐",
    gradient: "from-pink-400 via-rose-400 to-pink-500",
    textColor: "text-pink-50",
    bg: "bg-pink-100 text-pink-700",
    cardStyle: "bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500",
  };
}

function TierBadge({ tierKey, wide }: { tierKey: string; wide?: boolean }) {
  const cfg = getTierConfig(tierKey);
  return (
    <div className={`${cfg.cardStyle} rounded-2xl flex flex-col items-center justify-center gap-0.5 ${wide ? "px-10 py-3" : "w-[104px] py-3"}`}>
      <span className="text-lg leading-none">{cfg.emoji}</span>
      <span className={`text-xs font-black leading-tight text-center ${cfg.textColor}`}>{cfg.label}</span>
    </div>
  );
}

function TierPreviewCard({ tierKey }: { tierKey: string }) {
  const cfg = getTierConfig(tierKey);
  const isElite = ELITE_TIERS.includes(tierKey);
  const isDragon = DRAGON_TIERS.includes(tierKey);
  const isPhoenix = PHOENIX_TIERS.includes(tierKey);

  if (isElite) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-3 text-center ${isDragon ? "tier-card-dragon" : "tier-card-phoenix"}`}>
        <div className="relative z-10">
          <span className="text-2xl drop-shadow-lg">{cfg.emoji}</span>
          <p className={`text-xs font-bold mt-1 ${cfg.textColor}`}>{cfg.label}</p>
          <p className={`text-[9px] opacity-70 ${cfg.textColor}`}>{isDragon ? "Hạng rồng" : "Hạng phượng"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-3 text-center ${cfg.cardStyle}`}>
      <span className="text-2xl">{cfg.emoji}</span>
      <p className={`text-xs font-bold mt-1 ${cfg.textColor}`}>{cfg.label}</p>
    </div>
  );
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ShippingStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes("đã giao") || s.includes("giao thành công")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{status}</span>;
  }
  if (s.includes("đang vận chuyển") || s.includes("đang giao")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{status}</span>;
  }
  if (s.includes("đã gửi") || s.includes("đvvc")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{status}</span>;
  }
  if (s.includes("về kho") || s.includes("chờ")) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{status}</span>;
  }
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{status}</span>;
}

function SheetOrderCard({ order }: { order: SheetOrder }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        className="w-full p-4 flex items-start gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <ShoppingBag size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm line-clamp-1">{order.products || "Đơn hàng"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.timestamp)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {order.totalPrice && (
            <span className="text-sm font-black text-primary">{order.totalPrice}</span>
          )}
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 bg-muted/30">
          {order.shippingMethod && (
            <div className="flex items-start gap-2">
              <Truck size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-xs">{order.shippingMethod}</span>
            </div>
          )}
          {order.address && (
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-xs">{order.address}</span>
            </div>
          )}
          {order.notes && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-muted-foreground font-semibold w-12 shrink-0 mt-0.5">Ghi chú</span>
              <span className="text-xs italic text-muted-foreground">{order.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MembershipPage() {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<MemberShipping[]>([]);
  const [orders, setOrders] = useState<SheetOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    const p = phone.trim();
    setSearchPhone(p);
    setProfile(null);
    setShipping([]);
    setOrders([]);
    setProfileError(null);

    setProfileLoading(true);
    const base = getBaseUrl();

    try {
      const [profileResp, ordersResp] = await Promise.all([
        fetch(`${base}/api/sheets/member-profile?phone=${encodeURIComponent(p)}`),
        fetch(`${base}/api/sheets/member-orders?phone=${encodeURIComponent(p)}`),
      ]);

      if (profileResp.ok) {
        const profileData: MemberProfile = await profileResp.json();
        setProfile(profileData);

        const shippingResp = await fetch(
          `${base}/api/sheets/member-shipping?code=${encodeURIComponent(profileData.customerCode)}`
        );
        if (shippingResp.ok) {
          setShipping(await shippingResp.json());
        }
      } else if (profileResp.status === 404) {
        setProfileError("Không tìm thấy thành viên");
      } else {
        setProfileError("Không thể kết nối dữ liệu");
      }

      if (ordersResp.ok) {
        setOrders(await ordersResp.json());
      }
    } catch {
      setProfileError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setProfileLoading(false);
    }
  };

  const tier = profile ? getTierConfig(profile.tier) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-10 pb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Star size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Thành Viên</h1>
            <p className="text-xs opacity-70 mt-0.5">Tích điểm · Voucher · Vận chuyển</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className="w-full bg-white/15 border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Nhập số điện thoại..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              data-testid="input-member-phone"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={profileLoading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5"
            data-testid="button-search-member"
          >
            <Search size={15} />
            Tra cứu
          </button>
        </div>
      </div>

      <div className="px-4 py-4 -mt-2 space-y-4 pb-28">
        {profileLoading && (
          <div className="space-y-3">
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        )}

        {!profileLoading && profileError && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto">
              <Trophy size={28} strokeWidth={1.3} className="text-muted-foreground" />
            </div>
            <p className="font-bold">Không tìm thấy thành viên</p>
            <p className="text-sm text-muted-foreground">Số điện thoại chưa đăng ký membership hoặc chưa có trong hệ thống.</p>
          </div>
        )}

        {!profileLoading && profile && tier && (
          <>
            <div
              className={`${tier.elite ? (DRAGON_TIERS.includes(profile.tier.toLowerCase().trim()) ? "tier-card-dragon" : "tier-card-phoenix") : `bg-gradient-to-br ${tier.gradient}`} rounded-2xl p-5 shadow-xl relative overflow-hidden`}
              data-testid="member-card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-black/10 -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-black/15 translate-y-6 -translate-x-6" />

              <div className="relative flex items-start justify-between mb-1">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${tier.textColor} opacity-80`}>Tiệm Chu Du</p>
                  <h2 className={`text-2xl font-black mt-0.5 drop-shadow-sm ${tier.textColor}`}>{profile.name}</h2>
                  <div className={`flex items-center gap-1 mt-1 ${tier.textColor} opacity-90`}>
                    <Hash size={11} />
                    <span className="text-xs font-mono font-bold">{profile.customerCode}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl drop-shadow-sm">{tier.emoji}</span>
                  <p className={`text-sm font-black mt-0.5 drop-shadow-sm ${tier.textColor}`} data-testid="text-tier">{tier.label}</p>
                </div>
              </div>

              <div className="relative bg-black/15 rounded-xl p-3 mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold ${tier.textColor} opacity-90`}>Điểm tích lũy</span>
                  <span className={`font-black text-xl drop-shadow-sm ${tier.textColor}`} data-testid="text-points">
                    {profile.points.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${tier.textColor} opacity-90`}>Điểm trong năm</span>
                  <span className={`text-sm font-bold ${tier.textColor}`}>
                    {profile.yearPoints.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} pts
                  </span>
                </div>
                {profile.redeemedPoints > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs font-semibold ${tier.textColor} opacity-90`}>Đã quy đổi</span>
                    <span className={`text-sm font-bold ${tier.textColor}`}>
                      -{profile.redeemedPoints.toLocaleString()} pts
                    </span>
                  </div>
                )}
              </div>

              {profile.phone && (
                <div className={`relative flex items-center gap-1 mt-2 ${tier.textColor} opacity-80`}>
                  <Phone size={11} />
                  <span className="text-xs font-semibold">{profile.phone}</span>
                  {profile.birthday && (
                    <>
                      <span className="mx-1">·</span>
                      <Calendar size={11} />
                      <span className="text-xs">{profile.birthday}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-card border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ticket size={16} className="text-primary" />
                <h3 className="font-bold text-base">Voucher Membership</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-primary">{profile.vouchersGranted}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Được tặng</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-muted-foreground">{profile.vouchersUsed}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Đã dùng</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
                  <p className="text-lg font-black text-primary">{profile.vouchersRemaining}</p>
                  <p className="text-[10px] text-primary/70 font-medium mt-0.5">Còn lại</p>
                </div>
              </div>
              {(() => {
                const benefits = tierConfig[profile.tier.toLowerCase().trim()]?.benefits ?? [];
                if (!benefits.length) return null;
                return (
                  <div className="border-t border-border pt-3 mt-1">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Quyền lợi hạng {tier?.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {benefits.map((b: string, i: number) => (
                        <span key={i} className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {shipping.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={16} className="text-primary" />
                  <h3 className="font-bold text-base">Mã Vận Đơn</h3>
                </div>
                <div className="space-y-2">
                  {shipping.map((s, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">{s.carrier}</p>
                          <p className="font-mono font-bold text-base text-foreground">{s.trackingCode}</p>
                        </div>
                        <ShippingStatusBadge status={s.status} />
                      </div>
                      {s.shippingFee && (
                        <p className="text-xs text-muted-foreground">
                          Cước phí: <span className="font-semibold text-foreground">{s.shippingFee}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(profile.facebookName || profile.address) && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-primary" />
                  <h3 className="font-bold text-sm">Thông tin thêm</h3>
                </div>
                {profile.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{profile.address}</span>
                  </div>
                )}
                {profile.facebookName && (
                  <div className="flex items-center gap-2">
                    <ExternalLink size={13} className="text-muted-foreground shrink-0" />
                    {profile.facebookLink ? (
                      <a href={profile.facebookLink} target="_blank" rel="noreferrer"
                        className="text-sm text-primary font-medium underline underline-offset-2">
                        {profile.facebookName}
                      </a>
                    ) : (
                      <span className="text-sm">{profile.facebookName}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {!ordersLoading && orders.length > 0 && (() => {
              const recent = [...orders].reverse().slice(0, 4);
              return (
                <div className="bg-card border border-primary/15 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={15} className="text-primary" />
                    <h3 className="font-bold text-sm">Hàng Gần Nhất</h3>
                    <Badge variant="secondary" className="text-[10px] ml-auto">{orders.length} đơn tổng</Badge>
                  </div>
                  <div className="space-y-2">
                    {recent.map((order, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${i === 0 ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                            {order.products || "—"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{formatDate(order.timestamp)}</span>
                            {order.totalPrice && (
                              <>
                                <span className="text-muted-foreground/40 text-[10px]">·</span>
                                <span className="text-[10px] font-bold text-primary">{order.totalPrice}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(ordersLoading || orders.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag size={16} className="text-primary" />
                  <h3 className="font-bold text-base">Lịch Sử Đơn Hàng</h3>
                  <Badge variant="secondary" className="text-[10px]">{orders.length} đơn</Badge>
                </div>
                {ordersLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                  </div>
                )}
                {!ordersLoading && orders.length > 0 && (
                  <div className="space-y-2">
                    {[...orders].reverse().map((order, i) => (
                      <SheetOrderCard key={i} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!searchPhone && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center">
              <Trophy size={30} strokeWidth={1.2} className="text-primary/40" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-foreground text-base">Kiểm tra thẻ thành viên</h3>
              <p className="text-sm mt-1">Nhập số điện thoại để xem thông tin membership, voucher và mã vận đơn</p>
            </div>

            {/* Tier chart */}
            <div className="w-full max-w-sm mt-2">
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-semibold mb-4">Hệ thống hạng thành viên</p>

              {/* Heart layout: row1=2, row2=3, row3=1 */}
              <div className="flex flex-col items-center gap-2">
                {/* Row 1 — top 2 bumps */}
                <div className="flex gap-2 justify-center">
                  {["newcomer","friend of store"].map((k) => <TierBadge key={k} tierKey={k} />)}
                </div>
                {/* Row 2 — widest */}
                <div className="flex gap-2 justify-center">
                  {["muses","dreamer","ruby"].map((k) => <TierBadge key={k} tierKey={k} />)}
                </div>
                {/* Row 3 — heart point */}
                <div className="flex gap-2 justify-center">
                  {["platinum"].map((k) => <TierBadge key={k} tierKey={k} />)}
                </div>

                {/* Priviledged — centered alone */}
                <div className="mt-1">
                  <TierBadge tierKey="priviledged" wide />
                </div>
              </div>

              {/* Hidden elite tiers — names only */}
              <div className="mt-5">
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-semibold mb-3">✦ Hạng đặc biệt ẩn ✦</p>
                <div className="flex flex-row flex-wrap justify-center gap-2">
                  {(["infinite","solstice","patron","voyager"] as const).map((k) => {
                    const cfg = getTierConfig(k);
                    const isDragon = DRAGON_TIERS.includes(k);
                    return (
                      <div
                        key={k}
                        className={`relative overflow-hidden rounded-xl px-5 py-2 ${isDragon ? "tier-card-dragon" : "tier-card-phoenix"}`}
                      >
                        <span className={`relative z-10 text-sm font-black tracking-widest uppercase ${cfg.textColor}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
