import { Home, Package, LayoutDashboard, Image, MessageCircle, FolderTree, ShoppingCart, Building, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const location = useLocation();

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
      path: "/admin/favicon",
      icon: Star,
      label: "Favicon",
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
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-background border-r border-border min-h-screen p-4 flex flex-col animate-slide-in-left">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-1">Painel Admin</h2>
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
      </div>
    </aside>
  );
}