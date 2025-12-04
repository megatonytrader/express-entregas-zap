import { Home, Package, Settings, LogOut, LayoutDashboard, Image, MessageCircle, FolderTree, ShoppingCart, Building } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const menuItems = [
    {
      path: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/admin/orders",
      icon: Package,
      label: "Pedidos",
    },
    {
      path: "/admin/categories",
      icon: FolderTree,
      label: "Categorias",
    },
    {
      path: "/admin/products",
      icon: ShoppingCart,
      label: "Produtos",
    },
    {
      path: "/admin/logo",
      icon: Image,
      label: "Logo",
    },
    {
      path: "/admin/whatsapp",
      icon: MessageCircle,
      label: "WhatsApp",
    },
    {
      path: "/admin/company-settings",
      icon: Building,
      label: "Empresa",
    },
    {
      path: "/admin/account-settings",
      icon: Settings,
      label: "Conta",
    },
  ];

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logout realizado",
      description: "Você saiu do painel administrativo",
    });
    navigate("/admin/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-background border-r border-border min-h-screen p-4 flex flex-col animate-slide-in-left">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-1">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Gestão do sistema</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                active
                  ? "bg-primary text-primary-foreground shadow-soft scale-105"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link to="/">
            <Home className="h-5 w-5" />
            <span>Ver Loja</span>
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
}