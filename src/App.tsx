import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Admin from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";
import AdminLogin from "./pages/AdminLogin";
import AdminCategories from "./pages/AdminCategories";
import AdminProducts from "./pages/AdminProducts";
import AdminLogo from "./pages/AdminLogo";
import AdminWhatsApp from "./pages/AdminWhatsApp";
import AdminCompanySettings from "./pages/AdminCompanySettings";
import AdminAccountSettings from "./pages/AdminAccountSettings";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminFavicon from "./pages/AdminFavicon";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "favicon_url")
          .maybeSingle();

        if (error) throw error;

        if (data?.value) {
          let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
          if (link) {
            link.href = data.value;
          } else {
            link = document.createElement('link');
            link.rel = 'icon';
            link.href = data.value;
            document.head.appendChild(link);
          }
        }
      } catch (error) {
        console.error("Error loading favicon:", error);
      }
    };

    loadFavicon();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AdminAuthProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <Admin />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <AdminProtectedRoute>
                      <AdminOrders />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <AdminProtectedRoute>
                      <AdminCategories />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminProtectedRoute>
                      <AdminProducts />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/logo"
                  element={
                    <AdminProtectedRoute>
                      <AdminLogo />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/favicon"
                  element={
                    <AdminProtectedRoute>
                      <AdminFavicon />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/whatsapp"
                  element={
                    <AdminProtectedRoute>
                      <AdminWhatsApp />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/company-settings"
                  element={
                    <AdminProtectedRoute>
                      <AdminCompanySettings />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/account-settings"
                  element={
                    <AdminProtectedRoute>
                      <AdminAccountSettings />
                    </AdminProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </AdminAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;