import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, ShoppingCart, Package } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileMenuProps {
  logoUrl?: string;
  companyTitle?: string;
}

export function MobileMenu({ logoUrl, companyTitle }: MobileMenuProps) {
  const navItems = [
    { path: "/", label: "Início", icon: Home },
    { path: "/cart", label: "Carrinho", icon: ShoppingCart },
    { path: "/orders", label: "Meus Pedidos", icon: Package },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              )}
              <span className="text-lg font-bold">{companyTitle}</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-4 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}