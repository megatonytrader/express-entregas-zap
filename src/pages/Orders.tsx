import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import notificationSound from "@/assets/campainha.mp3";

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "delivering" | "delivered" | "rejected";
  created_at: string;
  rejection_reason?: string | null;
}

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOrderUpdate = async (updatedOrder: any) => {
    console.log('Handling order update:', updatedOrder);
    
    // Fetch items for the updated order
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, product_price")
      .eq("order_id", updatedOrder.id);

    const orderWithItems = {
      id: updatedOrder.id,
      total: updatedOrder.total,
      status: updatedOrder.status as Order["status"],
      created_at: updatedOrder.created_at,
      rejection_reason: updatedOrder.rejection_reason,
      items: items || []
    };

    setOrders(prev => {
      const exists = prev.find(order => order.id === updatedOrder.id);
      if (exists) {
        // Update existing order
        return prev.map(order => 
          order.id === updatedOrder.id ? orderWithItems : order
        );
      } else {
        // Add new order (in case it was just created for this user)
        return [orderWithItems, ...prev];
      }
    });

    // Play notification sound
    const audio = new Audio(notificationSound);
    audio.play().catch(err => console.log('Error playing notification:', err));

    // Show toast notification for status changes
    if (updatedOrder.status === "preparing") {
      toast({
        title: "Pedido Aceito! 🎉",
        description: "Seu pedido está sendo preparado.",
      });
    } else if (updatedOrder.status === "delivering") {
      toast({
        title: "Pedido Saiu para Entrega! 🚚",
        description: "Seu pedido está a caminho.",
      });
    } else if (updatedOrder.status === "delivered") {
      toast({
        title: "Pedido Entregue! ✓",
        description: "Obrigado pela preferência!",
      });
    } else if (updatedOrder.status === "rejected") {
      toast({
        title: "Pedido Rejeitado 😔",
        description: updatedOrder.rejection_reason || "Entre em contato para mais informações.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadOrders();

    // Setup realtime subscription for order updates
    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            handleOrderUpdate(payload.new as any);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Buscar todos os pedidos (por enquanto não está ligado ao usuário logado)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from("order_items")
            .select("product_name, quantity, product_price")
            .eq("order_id", order.id);

          if (itemsError) throw itemsError;

          return {
            id: order.id,
            total: order.total,
            status: order.status as Order["status"],
            created_at: order.created_at,
            rejection_reason: order.rejection_reason,
            items: items || []
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar seus pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: Order["status"]) => {
    const configs = {
      pending: {
        label: "Pendente",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        description: "Seu pedido foi recebido",
      },
      preparing: {
        label: "Em Preparo",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Package,
        description: "Estamos preparando seu pedido",
      },
      delivering: {
        label: "Em Entrega",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Truck,
        description: "Seu pedido está a caminho",
      },
      delivered: {
        label: "Entregue",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        description: "Pedido entregue com sucesso",
      },
      rejected: {
        label: "Rejeitado",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        description: "Pedido rejeitado",
      },
    };
    return configs[status];
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <header className="bg-background border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Package className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold">Meus Pedidos</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Acompanhe seus pedidos</h1>
          <p className="text-muted-foreground">Veja o status em tempo real</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não fez nenhum pedido
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={order.id} className="p-6 animate-fade-in">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-primary">#{order.id.substring(0, 8)}</h3>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{getTimeAgo(order.created_at)}</p>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      R$ {order.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-4">
                    <StatusIcon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">{statusConfig.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.status === "rejected" && order.rejection_reason 
                          ? order.rejection_reason
                          : statusConfig.description
                        }
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Itens do Pedido
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-medium">
                            R$ {(item.quantity * item.product_price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Orders;
