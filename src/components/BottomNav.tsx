import { ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";

export function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  const navItems = [
    {
      path: "/cart",
      icon: ShoppingCart,
      label: "Carrinho",
      badge: itemCount,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-50 safe-area-inset-bottom">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-end py-3">
          <Link
            to="/cart"
            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ease-out relative group ${
              isActive("/cart")
                ? "bg-primary text-primary-foreground shadow-medium scale-105"
                : "bg-muted/50 text-foreground hover:bg-muted hover:scale-105 hover:shadow-soft"
            }`}
          >
            <div className="relative">
              <ShoppingCart
                className={`h-6 w-6 transition-all duration-300 ease-out ${
                  isActive("/cart") ? "scale-110" : "group-hover:scale-110"
                }`}
              />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 min-w-[1.25rem] flex items-center justify-center p-0 px-1.5 bg-accent text-accent-foreground text-xs font-bold animate-scale-in shadow-soft border-2 border-background">
                  {itemCount}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">Carrinho</span>
              {itemCount > 0 && (
                <span className="text-xs opacity-90">
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
