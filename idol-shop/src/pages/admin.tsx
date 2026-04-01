import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts, getListProductsQueryKey, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListOrders, getListOrdersQueryKey, useUpdateOrder,
  useListShippingUpdates, getListShippingUpdatesQueryKey, useCreateShippingUpdate, useUpdateShippingUpdate, useDeleteShippingUpdate,
  useListMembers, getListMembersQueryKey, useCreateMember, useAddPoints,
  useListRewards, getListRewardsQueryKey, useCreateReward, useDeleteReward, useUpdateReward,
  useGetOrderSummary,
} from "@workspace/api-client-react";
import {
  Shield, Package, ShoppingBag, Truck, Users, Gift, LogOut, Plus, Pencil, Trash2, ChevronDown,
  TrendingUp, Star, Calendar, X, Check, BarChart3, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

function getBaseUrl() {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

const ADMIN_PASSWORD = "admin123";

function formatPrice(p: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const statusOptions = ["awaiting", "pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusLabels: Record<string, string> = {
  awaiting: "Chờ xác nhận", pending: "Đã nhập thông tin", confirmed: "Đã chuyển khoản", shipped: "Đang giao", delivered: "Đã giao", cancelled: "Đã hủy",
};
const statusColors: Record<string, string> = {
  awaiting: "bg-gray-100 text-gray-600", pending: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700", delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const shippingStatusOptions = ["web_order", "warehouse_origin", "warehouse_vn", "sorting", "preparing", "in_transit", "delivered", "returned"];
const shippingStatusLabels: Record<string, string> = {
  web_order: "Web trả hàng",
  warehouse_origin: "Đã về kho tại nước sở tại",
  warehouse_vn: "Về kho Việt",
  sorting: "Phân loại hàng",
  preparing: "Chuẩn bị giao",
  in_transit: "Đang giao",
  arrived: "Đã về kho",
  delivered: "Đã giao",
  returned: "Trả đơn toàn bộ",
};

const tierColors: Record<string, string> = {
  bronze: "text-orange-600", silver: "text-slate-500", gold: "text-amber-500", platinum: "text-violet-600",
};

// ===================== Login =====================
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs bg-card border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-black text-center mb-1">Admin Panel</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">Nhập mật khẩu để tiếp tục</p>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && (pw === ADMIN_PASSWORD ? onLogin() : setError(true))}
            data-testid="input-admin-password"
            className="rounded-xl"
          />
          {error && <p className="text-destructive text-xs font-semibold">Mật khẩu không đúng</p>}
          <Button
            className="w-full rounded-xl font-bold"
            onClick={() => { if (pw === ADMIN_PASSWORD) { onLogin(); } else { setError(true); } }}
            data-testid="button-admin-login"
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===================== Dashboard =====================
function DashboardTab() {
  const { data: summary } = useGetOrderSummary();
  const { data: members } = useListMembers();
  const { data: products } = useListProducts();

  const stats = [
    { label: "Tổng đơn hàng", value: summary?.totalOrders ?? 0, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Doanh thu", value: summary ? formatPrice(summary.totalRevenue) : "0đ", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Thành viên", value: members?.length ?? 0, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Sản phẩm", value: products?.length ?? 0, icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-lg font-black">{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {summary && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> Theo trạng thái</h3>
          {Object.entries((summary.byStatus ?? {}) as Record<string, number>).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <Badge className={`text-[10px] ${statusColors[status] ?? ""}`} variant="secondary">
                {statusLabels[status] ?? status}
              </Badge>
              <span className="font-bold text-sm">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== Products =====================
function ProductsTab() {
  const { data: products } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "Kpop", stock: "0", isAvailable: true, orderType: "preorder", imageUrl: "" });

  const resetForm = () => setForm({ name: "", description: "", price: "", category: "Kpop", stock: "0", isAvailable: true, orderType: "preorder", imageUrl: "" });

  const openEdit = (p: NonNullable<typeof products>[0]) => {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), category: p.category, stock: String(p.stock), isAvailable: p.isAvailable, orderType: p.orderType, imageUrl: p.imageUrl ?? "" });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) { toast({ title: "Vui lòng nhập đủ thông tin", variant: "destructive" }); return; }
    const data = { name: form.name, description: form.description || null, price: parseFloat(form.price), category: form.category, stock: parseInt(form.stock), isAvailable: form.isAvailable, orderType: form.orderType, imageUrl: form.imageUrl || null };
    if (editId) {
      updateProduct.mutate({ id: editId, data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); resetForm(); setEditId(null); toast({ title: "Đã cập nhật sản phẩm" }); },
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); resetForm(); toast({ title: "Đã thêm sản phẩm mới" }); },
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Sản Phẩm ({products?.length ?? 0})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setEditId(null); setOpen(true); }} data-testid="button-add-product">
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Tên sản phẩm *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" data-testid="input-product-name" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  "Photocard Set", "Album Standard", "Album Special", "Lightstick",
                  "Plush", "Keychain", "Poster", "Slogan", "Wappen",
                  "PC Holder", "Standee", "Fan", "Acrylic", "Sticker Pack",
                  "Weverse Album", "Limited Edition", "Merch Bundle",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      name: f.name ? `${f.name.trimEnd()} - ${preset}` : preset,
                    }))}
                    className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/15"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Giá (VND) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl mt-1" data-testid="input-product-price" /></div>
              <div><Label>Tồn kho</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Kpop", "GMMTV", "US UK", "Tạp Hoá"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loại</Label>
                <Select value={form.orderType} onValueChange={(v) => setForm({ ...form, orderType: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preorder">Pre-order</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="instock">Hàng sẵn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>URL ảnh</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="rounded-xl mt-1" /></div>
            <div className="flex items-center gap-3 py-1">
              <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} id="avail" />
              <Label htmlFor="avail">Đang bán</Label>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSave} data-testid="button-save-product">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {products?.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3" data-testid={`admin-product-${p.id}`}>
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
              <Package size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-primary font-bold">{formatPrice(p.price)}</span>
                <span className="text-xs text-muted-foreground">Kho: {p.stock}</span>
                <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-semibold">{p.orderType}</span>
                {!p.isAvailable && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">Tắt</Badge>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}><Pencil size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => deleteProduct.mutate({ id: p.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }) })} data-testid={`button-delete-product-${p.id}`}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Orders =====================
function OrderAddressInfo({ phone }: { phone: string }) {
  const [address, setAddress] = useState<string | null>(null);
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  useEffect(() => {
    fetch(`${base}/api/sheets/member-profile?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.address) setAddress(data.address); })
      .catch(() => {});
  }, [phone]);

  if (!address) return null;
  return (
    <div className="text-xs bg-blue-50 border border-blue-100 rounded-xl p-2 text-blue-800 space-y-0.5">
      <p className="font-bold">📍 Địa chỉ giao hàng (Sovereign Club)</p>
      <p>{address}</p>
    </div>
  );
}

function OrdersTab() {
  const { data: orders } = useListOrders();
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${base}/api/orders/cleanup`, { method: "DELETE" }).catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="font-bold">Đơn Hàng ({orders?.length ?? 0})</h3>
      <div className="space-y-2">
        {orders && [...orders].reverse().map((order) => {
          let items: Array<{ name: string; quantity: number; price: number }> = [];
          try { items = JSON.parse(order.items); } catch {}
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden" data-testid={`admin-order-${order.id}`}>
              <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">#{order.id} · {order.memberName}</span>
                    <Badge className={`text-[10px] ${statusColors[order.status] ?? ""}`} variant="secondary">
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.memberPhone} · {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-primary">{formatPrice(order.totalAmount)}</span>
                  <ChevronDown size={14} className={`transition-transform text-muted-foreground ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border p-3 space-y-3 bg-muted/30">
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.name} ×{item.quantity}</span>
                        <span className="text-muted-foreground font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <OrderAddressInfo phone={order.memberPhone} />
                  {order.notes && <p className="text-xs bg-amber-50 border border-amber-100 rounded-xl p-2 text-amber-700">📝 {order.notes}</p>}
                  <div>
                    <Label className="text-xs">Cập nhật trạng thái</Label>
                    <Select value={order.status} onValueChange={(v) => {
                      updateOrder.mutate({ id: order.id, data: { status: v } }, {
                        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }); toast({ title: "Đã cập nhật" }); },
                      });
                    }}>
                      <SelectTrigger className="mt-1 rounded-xl" data-testid={`select-status-${order.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== Shipping =====================
function ShippingTab() {
  const { data: updates } = useListShippingUpdates();
  const createUpdate = useCreateShippingUpdate();
  const updateUpdate = useUpdateShippingUpdate();
  const deleteUpdate = useDeleteShippingUpdate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "preparing", estimatedDate: "" });

  const resetForm = () => setForm({ title: "", description: "", status: "preparing", estimatedDate: "" });
  const openEdit = (u: NonNullable<typeof updates>[0]) => {
    setEditId(u.id); setForm({ title: u.title, description: u.description, status: u.status, estimatedDate: u.estimatedDate ?? "" }); setOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.description) { toast({ title: "Nhập đủ thông tin", variant: "destructive" }); return; }
    const data = { title: form.title, description: form.description, status: form.status, estimatedDate: form.estimatedDate || null };
    if (editId) {
      updateUpdate.mutate({ id: editId, data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }); setOpen(false); resetForm(); setEditId(null); toast({ title: "Đã cập nhật" }); } });
    } else {
      createUpdate.mutate({ data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }); setOpen(false); resetForm(); toast({ title: "Đã thêm cập nhật vận chuyển" }); } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Vận Chuyển ({updates?.length ?? 0})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setEditId(null); setOpen(true); }} data-testid="button-add-shipping">
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa cập nhật" : "Thêm cập nhật vận chuyển"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl mt-1" data-testid="input-shipping-title" /></div>
            <div><Label>Mô tả *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-xl mt-1" /></div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {shippingStatusOptions.map((s) => <SelectItem key={s} value={s}>{shippingStatusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ngày dự kiến</Label><Input type="date" value={form.estimatedDate} onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })} className="rounded-xl mt-1" /></div>
            <Button className="w-full rounded-xl" onClick={handleSave} data-testid="button-save-shipping">Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {updates && [...updates].reverse().map((u) => (
          <div key={u.id} className="bg-card border border-border rounded-2xl p-3 flex items-start gap-3" data-testid={`admin-shipping-${u.id}`}>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{u.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.description}</p>
              <Badge variant="outline" className="text-[10px] mt-1 rounded-full">{shippingStatusLabels[u.status] ?? u.status}</Badge>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(u)}><Pencil size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => deleteUpdate.mutate({ id: u.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListShippingUpdatesQueryKey() }) })}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Pre-order Schedule =====================
interface PreorderItem {
  id: number; title: string; description: string | null; startDate: string | null; deadline: string | null; pickupDate: string | null;
  imageUrl: string | null; artist: string | null; isActive: boolean; createdAt: string;
}

function PreorderTab() {
  const [items, setItems] = useState<PreorderItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", startDate: "", deadline: "", pickupDate: "", artist: "", imageUrl: "", isActive: true });
  const { toast } = useToast();

  const fetchItems = () => {
    fetch(`${getBaseUrl()}/api/preorder-schedule`).then((r) => r.json()).then(setItems).catch(() => {});
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => setForm({ title: "", description: "", startDate: "", deadline: "", pickupDate: "", artist: "", imageUrl: "", isActive: true });

  const openEdit = (item: PreorderItem) => {
    setEditId(item.id);
    setForm({ title: item.title, description: item.description ?? "", startDate: item.startDate ?? "", deadline: item.deadline ?? "", pickupDate: item.pickupDate ?? "", artist: item.artist ?? "", imageUrl: item.imageUrl ?? "", isActive: item.isActive });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast({ title: "Nhập tiêu đề", variant: "destructive" }); return; }
    const body = { title: form.title, description: form.description || null, startDate: form.startDate || null, deadline: form.deadline || null, pickupDate: form.pickupDate || null, artist: form.artist || null, imageUrl: form.imageUrl || null, isActive: form.isActive };
    const url = editId ? `${getBaseUrl()}/api/preorder-schedule/${editId}` : `${getBaseUrl()}/api/preorder-schedule`;
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchItems(); setOpen(false); resetForm(); setEditId(null);
    toast({ title: editId ? "Đã cập nhật lịch pre-order" : "Đã thêm lịch pre-order" });
  };

  const handleDelete = async (id: number) => {
    await fetch(`${getBaseUrl()}/api/preorder-schedule/${id}`, { method: "DELETE" });
    fetchItems(); toast({ title: "Đã xóa" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Lịch Pre-order ({items.length})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setEditId(null); setOpen(true); }} data-testid="button-add-preorder">
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Sửa lịch pre-order" : "Thêm lịch pre-order"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl mt-1" /></div>
            <div><Label>Nghệ sĩ / Nhóm</Label><Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} placeholder="BTS, aespa, NewJeans..." className="rounded-xl mt-1" /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Bắt đầu PO</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label>Deadline PO</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-xl mt-1" /></div>
            </div>
            <div><Label>Lịch pickup</Label><Input type="date" value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} className="rounded-xl mt-1" /></div>
            <div><Label>URL ảnh</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="rounded-xl mt-1" /></div>
            <div className="flex items-center gap-3 py-1">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="isActive" />
              <Label htmlFor="isActive">Đang mở pre-order</Label>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSave}>Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className={`bg-card border rounded-2xl p-3 flex items-start gap-3 ${!item.isActive ? "opacity-60" : "border-border"}`} data-testid={`admin-preorder-${item.id}`}>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{item.title}</p>
              {item.artist && <p className="text-xs text-primary font-semibold mt-0.5">{item.artist}</p>}
              <div className="flex flex-wrap gap-x-3 mt-0.5">
                {item.startDate && <p className="text-xs text-muted-foreground">Bắt đầu: {item.startDate}</p>}
                {item.deadline && <p className="text-xs text-muted-foreground">Deadline: {item.deadline}</p>}
                {item.pickupDate && <p className="text-xs text-emerald-600 font-medium">Pickup: {item.pickupDate}</p>}
              </div>
              {!item.isActive && <Badge variant="secondary" className="text-[10px] mt-1">Đã đóng</Badge>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(item)}><Pencil size={13} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar size={28} strokeWidth={1.2} className="mx-auto mb-2" />
            <p className="text-sm">Chưa có lịch pre-order</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== Statistics =====================
function StatsTab() {
  const { data: orders } = useListOrders();

  const itemMap: Record<string, { qty: number; revenue: number }> = {};
  orders?.forEach((order) => {
    if (order.status === "cancelled") return;
    try {
      const items: Array<{ name: string; quantity: number; price: number }> = JSON.parse(order.items);
      items.forEach((it) => {
        if (!itemMap[it.name]) itemMap[it.name] = { qty: 0, revenue: 0 };
        itemMap[it.name].qty += it.quantity;
        itemMap[it.name].revenue += it.price * it.quantity;
      });
    } catch {}
  });

  const sorted = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty);
  const totalItems = sorted.reduce((s, [, v]) => s + v.qty, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Thống Kê Số Lượng Hàng Cần Đặt</h3>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Package size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-2xl font-black">{totalItems}</p>
          <p className="text-xs text-muted-foreground">Tổng sản phẩm cần đặt</p>
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 size={28} strokeWidth={1.2} className="mx-auto mb-2" />
          <p className="text-sm">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(([name, { qty, revenue }]) => {
            const pct = totalItems > 0 ? (qty / totalItems) * 100 : 0;
            return (
              <div key={name} className="bg-card border border-border rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm flex-1 min-w-0 truncate pr-2">{name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs font-black bg-primary/10 text-primary border-primary/20">
                      ×{qty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatPrice(revenue)}</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== Members =====================
interface SheetMember {
  customerCode: string; name: string; phone: string; tier: string; points: number;
  birthday: string; address: string; facebookName: string;
}

function MemberShippingBadge({ phone }: { phone: string }) {
  const [carrier, setCarrier] = useState<string | null>(null);
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  useEffect(() => {
    fetch(`${base}/api/sheets/member-orders?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.ok ? r.json() : [])
      .then((orders: any[]) => {
        const last = orders.filter((o) => o.shippingMethod).pop();
        if (last?.shippingMethod) setCarrier(last.shippingMethod);
      })
      .catch(() => {});
  }, [phone]);
  if (!carrier) return null;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">🚚 {carrier}</span>
  );
}

function MembersTab() {
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const addPoints = useAddPoints();
  const { data: dbMembers } = useListMembers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pointsOpen, setPointsOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [search, setSearch] = useState("");

  const fetchMembers = () => {
    setLoading(true);
    fetch(`${getBaseUrl()}/api/sheets/all-members`)
      .then((r) => r.json())
      .then((data) => { setMembers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setMembers([]); setLoading(false); });
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAddPoints = () => {
    if (!selectedPhone || !pointsAmount) return;
    const dbMember = dbMembers?.find((m) => m.phone.replace(/\D/g, "") === selectedPhone.replace(/\D/g, "") || m.phone === selectedPhone);
    if (!dbMember) { toast({ title: "Không tìm thấy trong hệ thống", variant: "destructive" }); return; }
    addPoints.mutate({ id: dbMember.id, data: { points: parseInt(pointsAmount), reason: null } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() }); setPointsOpen(false); setPointsAmount(""); toast({ title: "Đã thêm điểm" }); },
    });
  };

  const filtered = members.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search) || m.customerCode.toLowerCase().includes(search.toLowerCase())
  );

  const tierEmoji = (tier: string) => {
    const t = tier.toLowerCase();
    if (t.includes("dragon") || t.includes("phoenix") || t.includes("infinite") || t.includes("solstice") || t.includes("patron") || t.includes("voyager")) return "👑";
    if (t.includes("platinum") || t.includes("ruby")) return "💎";
    if (t.includes("gold")) return "🥇";
    if (t.includes("silver")) return "🥈";
    return "🌟";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Thành Viên ({filtered.length})</h3>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={fetchMembers}>
          Làm mới
        </Button>
      </div>

      <Input
        placeholder="Tìm theo tên, SĐT, mã KH..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-xl"
        data-testid="input-member-search"
      />

      <Dialog open={pointsOpen} onOpenChange={setPointsOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Thêm điểm thủ công</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm font-semibold">{members.find((m) => m.phone === selectedPhone)?.name}</p>
            <div><Label>Số điểm</Label><Input type="number" value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)} className="rounded-xl mt-1" data-testid="input-points-amount" /></div>
            <Button className="w-full rounded-xl" onClick={handleAddPoints} data-testid="button-save-points">Thêm điểm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Đang tải...</div>
      ) : (
      <div className="space-y-2">
        {filtered.map((m, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3" data-testid={`admin-member-${m.customerCode || idx}`}>
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0 font-black text-base text-muted-foreground">
              {(m.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm truncate">{m.name}</p>
                <span className="text-[11px]">{tierEmoji(m.tier)}</span>
                {m.customerCode && <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-semibold">{m.customerCode}</span>}
              </div>
              <p className="text-xs text-muted-foreground">{m.phone}</p>
              {m.address && (
                <p className="text-[11px] text-muted-foreground truncate">📍 {m.address}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">{m.points.toLocaleString()} pts</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">{m.tier}</Badge>
                <MemberShippingBadge phone={m.phone} />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl text-xs"
              onClick={() => { setSelectedPhone(m.phone); setPointsOpen(true); }}
              data-testid={`button-add-points-${m.customerCode || idx}`}
            >
              + Điểm
            </Button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

// ===================== Rewards =====================
function RewardsTab() {
  const { data: rewards } = useListRewards();
  const createReward = useCreateReward();
  const deleteReward = useDeleteReward();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", pointsCost: "", stock: "10", imageUrl: "" });

  const resetForm = () => setForm({ name: "", description: "", pointsCost: "", stock: "10", imageUrl: "" });

  const handleCreate = () => {
    if (!form.name || !form.pointsCost) { toast({ title: "Nhập đủ thông tin", variant: "destructive" }); return; }
    createReward.mutate({ data: { name: form.name, description: form.description || null, pointsCost: parseInt(form.pointsCost), stock: parseInt(form.stock), isAvailable: true, imageUrl: form.imageUrl || null } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() }); setOpen(false); resetForm(); toast({ title: "Đã thêm quà tặng" }); },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Quà Tặng ({rewards?.length ?? 0})</h3>
        <Button size="sm" className="rounded-xl" onClick={() => { resetForm(); setOpen(true); }}>
          <Plus size={14} className="mr-1" />Thêm
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Thêm quà tặng</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Tên quà *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" /></div>
            <div><Label>Mô tả</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Điểm đổi *</Label><Input type="number" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label>Số lượng</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl mt-1" /></div>
            </div>
            <Button className="w-full rounded-xl" onClick={handleCreate}>Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {rewards?.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Gift size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{r.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-amber-600">{r.pointsCost.toLocaleString()} pts</span>
                <span className="text-xs text-muted-foreground">Còn: {r.stock}</span>
                {!r.isAvailable && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600">Tắt</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive shrink-0" onClick={() => deleteReward.mutate({ id: r.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() }) })}>
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Main Admin =====================
const tabs = [
  { id: "dashboard", label: "Tổng quan", icon: BarChart3 },
  { id: "products", label: "Sản phẩm", icon: Package },
  { id: "orders", label: "Đơn hàng", icon: ShoppingBag },
  { id: "stats", label: "Thống kê", icon: TrendingUp },
  { id: "shipping", label: "Vận chuyển", icon: Truck },
  { id: "preorder", label: "Pre-order", icon: Calendar },
  { id: "members", label: "Thành viên", icon: Users },
  { id: "rewards", label: "Quà tặng", icon: Gift },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("admin_authenticated") === "true");
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogin = () => {
    localStorage.setItem("admin_authenticated", "true");
    setAuthed(true);
  };
  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    setAuthed(false);
  };

  if (!authed) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient px-4 pt-10 pb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-xs opacity-70">Quản lý toàn bộ hệ thống</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut size={13} />
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pt-3 pb-1 hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`admin-tab-${id}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "shipping" && <ShippingTab />}
        {activeTab === "preorder" && <PreorderTab />}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "rewards" && <RewardsTab />}
      </div>
    </div>
  );
}
