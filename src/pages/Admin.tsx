import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";

const Admin = () => {
  const stats = [
    {
      title: "Pedidos Hoje",
      value: "24",
      icon: ShoppingBag,
      trend: "+12%",
      color: "text-primary",
    },
    {
      title: "Pedidos Ativos",
      value: "8",
      icon: Package,
      trend: "+3",
      color: "text-accent",
    },
    {
      title: "Faturamento Hoje",
      value: "R$ 1.284,50",
      icon: TrendingUp,
      trend: "+18%",
      color: "text-secondary",
    },
  ];

  const recentOrders = [
    {
      id: "#1234",
      customer: "João Silva",
      items: 3,
      total: 85.50,
      status: "preparing",
      time: "10 min",
    },
    {
      id: "#1233",
      customer: "Maria Santos",
      items: 2,
      total: 54.90,
      status: "delivering",
      time: "25 min",
    },
    {
      id: "#1232",
      customer: "Pedro Costa",
      items: 1,
      total: 32.00,
      status: "delivered",
      time: "45 min",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      preparing: { label: "Preparando", variant: "default" as const },
      delivering: { label: "Entregando", variant: "secondary" as const },
      delivered: { label: "Entregue", variant: "outline" as const },
    };
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-background border-b border-border sticky top-0 z-10 shadow-soft lg:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Painel Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-secondary">
                  {stat.trend}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Pedidos Recentes</h2>
            <Button asChild>
              <Link to="/admin/orders">Ver Todos</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-primary">{order.id}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="font-medium">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.items} {order.items === 1 ? "item" : "itens"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">
                    R$ {order.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
      </div>
    </div>
  );
};

export default Admin;
