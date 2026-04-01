import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShoppingBag, Truck, Star, Calendar } from "lucide-react";
import ShopPage from "@/pages/shop";
import ShippingPage from "@/pages/shipping";
import MembershipPage from "@/pages/membership";
import AdminPage from "@/pages/admin";
import PreorderPage from "@/pages/preorder";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const navItems = [
  { path: "/", label: "Shop", icon: ShoppingBag },
  { path: "/preorder", label: "Lịch PO", icon: Calendar },
  { path: "/shipping", label: "Vận chuyển", icon: Truck },
  { path: "/membership", label: "Thành viên", icon: Star },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 nav-gradient border-t border-white/10 safe-area-bottom" data-testid="bottom-nav">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} className="flex-1">
              <div
                className={`relative flex flex-col items-center justify-center py-2.5 px-1 gap-1 transition-all duration-200 ${
                  isActive ? "text-primary" : "text-white/50 hover:text-white/80"
                }`}
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold leading-none tracking-wide ${isActive ? "text-primary" : ""}`}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <div className="pb-[60px]">
        <Switch>
          <Route path="/" component={ShopPage} />
          <Route path="/preorder" component={PreorderPage} />
          <Route path="/shipping" component={ShippingPage} />
          <Route path="/membership" component={MembershipPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
