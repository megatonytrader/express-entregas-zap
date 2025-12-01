import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Phone, Bell, Printer } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import notificationSound from "@/assets/campainha-admin.mp3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total: number;
  status: "pending" | "preparing" | "delivering" | "delivered" | "rejected";
  created_at: string;
  items: OrderItem[];
}

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCountRef = useRef(0);
  
  // Print settings
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printFontSize, setPrintFontSize] = useState("12");
  const [printWidth, setPrintWidth] = useState("300");

  useEffect(() => {
    loadOrders();
    
    // Initialize audio element
    audioRef.current = new Audio(notificationSound);
    audioRef.current.loop = true;
    
    // Setup realtime subscription for new orders and status updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          handleNewOrder(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload);
          handleOrderUpdate(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopNotificationSound();
    };
  }, []);

  const playNotificationSound = () => {
    if (!audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Audio play failed:', err);
    }
  };

  const stopNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleNewOrder = async (newOrder: any) => {
    // Fetch items for the new order
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, product_price")
      .eq("order_id", newOrder.id);

    const orderWithItems = {
      id: newOrder.id,
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      delivery_address: newOrder.delivery_address,
      total: newOrder.total,
      status: newOrder.status as "pending" | "preparing" | "delivering" | "delivered" | "rejected",
      created_at: newOrder.created_at,
      items: items || []
    };

    setOrders(prev => [orderWithItems, ...prev]);
    setNewOrdersCount(prev => prev + 1);

    // Play notification sound in loop
    playNotificationSound();

    // Show toast notification
    toast({
      title: "🎉 Novo Pedido Recebido!",
      description: `Pedido de ${newOrder.customer_name} - R$ ${newOrder.total.toFixed(2)}`,
      duration: 5000,
    });
  };

  const handleOrderUpdate = async (updatedOrder: any) => {
    // Fetch items for the updated order
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, product_price")
      .eq("order_id", updatedOrder.id);

    const orderWithItems = {
      id: updatedOrder.id,
      customer_name: updatedOrder.customer_name,
      customer_phone: updatedOrder.customer_phone,
      delivery_address: updatedOrder.delivery_address,
      total: updatedOrder.total,
      status: updatedOrder.status as "pending" | "preparing" | "delivering" | "delivered" | "rejected",
      created_at: updatedOrder.created_at,
      items: items || []
    };

    // Update the order in the list
    setOrders(prev => 
      prev.map(order => 
        order.id === updatedOrder.id ? orderWithItems : order
      )
    );

    console.log('Order list updated with new status:', updatedOrder.status);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
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
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            delivery_address: order.delivery_address,
            total: order.total,
            status: order.status as "pending" | "preparing" | "delivering" | "delivered" | "rejected",
            created_at: order.created_at,
            items: items || []
          };
        })
      );

      setOrders(ordersWithItems);
      lastOrderCountRef.current = ordersWithItems.length;
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearNewOrdersCount = () => {
    setNewOrdersCount(0);
  };

  const updateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Stop notification sound only when order is accepted (moved to preparing)
      if (newStatus === "preparing") {
        stopNotificationSound();
      }
      
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const statusMessages = {
          preparing: "Pedido em preparo",
          delivering: "Pedido saiu para entrega",
          delivered: "Pedido entregue",
        };
        
        toast({
          title: "Status atualizado!",
          description: statusMessages[newStatus],
        });
        
        // Enviar mensagem de status via WhatsApp
        const orderId_short = orderId.substring(0, 8);
        const message = `Olá ${order.customer_name}! 🚀\n\nSeu pedido #${orderId_short} está agora: *${statusMessages[newStatus]}*\n\nObrigado pela preferência!`;
        const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive",
      });
    }
  };

  const openPrintDialog = (order: Order) => {
    setSelectedOrder(order);
    setPrintDialogOpen(true);
  };

  const printOrder = (order: Order, fontSize: string = "12", width: string = "300") => {
    const orderId_short = order.id.substring(0, 8);
    const timeFormatted = new Date(order.created_at).toLocaleString('pt-BR');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Pedido #${orderId_short}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: ${width}px;
              margin: 0 auto;
              font-size: ${fontSize}px;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h1 {
              font-size: ${parseInt(fontSize) + 6}px;
              margin-bottom: 5px;
            }
            .header p {
              font-size: ${fontSize}px;
            }
            .section {
              margin: 15px 0;
              padding: 10px 0;
              border-bottom: 1px dashed #ccc;
            }
            .section:last-child {
              border-bottom: 2px dashed #000;
            }
            .label {
              font-weight: bold;
              font-size: ${parseInt(fontSize) - 1}px;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .value {
              font-size: ${parseInt(fontSize) + 1}px;
              margin-bottom: 8px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: ${fontSize}px;
            }
            .total {
              display: flex;
              justify-content: space-between;
              font-size: ${parseInt(fontSize) + 4}px;
              font-weight: bold;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: ${parseInt(fontSize) - 1}px;
            }
            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DeliveryApp</h1>
            <p>COMPROVANTE DE PEDIDO</p>
          </div>
          
          <div class="section">
            <div class="label">Pedido</div>
            <div class="value">#${orderId_short}</div>
            <div class="label">Data/Hora</div>
            <div class="value">${timeFormatted}</div>
            <div class="label">Status</div>
            <div class="value">${getStatusLabel(order.status)}</div>
          </div>
          
          <div class="section">
            <div class="label">Cliente</div>
            <div class="value">${order.customer_name}</div>
            <div class="label">Telefone</div>
            <div class="value">${order.customer_phone}</div>
            <div class="label">Endereço de Entrega</div>
            <div class="value">${order.delivery_address}</div>
          </div>
          
          <div class="section">
            <div class="label">Itens do Pedido</div>
            ${order.items.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.product_name}</span>
                <span>R$ ${(item.quantity * item.product_price).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="total">
              <span>TOTAL</span>
              <span>R$ ${order.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            Obrigado pela preferência!
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    setPrintDialogOpen(false);
  };

  const getStatusColor = (status: Order["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      preparing: "bg-blue-100 text-blue-800 border-blue-200",
      delivering: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status];
  };

  const getStatusLabel = (status: Order["status"]) => {
    const labels = {
      pending: "Pendente",
      preparing: "Preparando",
      delivering: "Entregando",
      delivered: "Entregue",
      rejected: "Rejeitado",
    };
    return labels[status];
  };

  const rejectOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const reason = window.prompt(
      `Por que deseja rejeitar o pedido de ${order.customer_name}?\n\nEste motivo será enviado ao cliente via WhatsApp.`
    );

    if (!reason || reason.trim() === "") {
      toast({
        title: "Rejeição cancelada",
        description: "É necessário informar o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update order status and save rejection reason
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "rejected",
          rejection_reason: reason.trim()
        })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: "rejected" as const } : o
      ));

      toast({
        title: "Pedido rejeitado",
        description: "O cliente será notificado via WhatsApp.",
      });

      // Send WhatsApp message to customer
      const orderId_short = orderId.substring(0, 8);
      const message = `Olá ${order.customer_name}! 😔\n\nInfelizmente precisamos rejeitar seu pedido #${orderId_short}.\n\n*Motivo:* ${reason.trim()}\n\nPedimos desculpas pelo inconveniente.`;
      const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast({
        title: "Erro ao rejeitar pedido",
        description: "Não foi possível rejeitar o pedido.",
        variant: "destructive",
      });
    }
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
              <Package className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">Gestão de Pedidos</span>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Pedidos</h1>
            <p className="text-muted-foreground">Acompanhe e gerencie todos os pedidos</p>
          </div>
          {newOrdersCount > 0 && (
            <Button 
              onClick={clearNewOrdersCount}
              className="relative"
              variant="outline"
            >
              <Bell className="h-5 w-5 mr-2" />
              {newOrdersCount} Novos
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
            <p className="text-muted-foreground">Os pedidos aparecerão aqui quando os clientes fizerem compras.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const timeAgo = new Date(order.created_at).toLocaleString('pt-BR');
              return (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-primary">#{order.id.substring(0, 8)}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="font-semibold text-lg">{order.customer_name}</p>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      <span>{order.customer_phone}</span>
                    </div>
                    <p className="text-muted-foreground mt-1">{order.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">{timeAgo}</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
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

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPrintDialog(order)}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  {order.status === "pending" && (
                    <>
                      <Button
                        onClick={() => updateStatus(order.id, "preparing")}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✓ Aceitar Pedido
                      </Button>
                      <Button
                        onClick={() => rejectOrder(order.id)}
                        variant="destructive"
                      >
                        ✗ Rejeitar Pedido
                      </Button>
                    </>
                  )}
                  {order.status === "preparing" && (
                    <Button
                      onClick={() => updateStatus(order.id, "delivering")}
                      variant="default"
                    >
                      Saiu para Entrega
                    </Button>
                  )}
                  {order.status === "delivering" && (
                    <Button
                      onClick={() => updateStatus(order.id, "delivered")}
                      className="bg-gradient-success"
                    >
                      Marcar como Entregue
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const orderId_short = order.id.substring(0, 8);
                      const message = `Olá ${order.customer_name}! Tudo bem?\n\nSobre o pedido #${orderId_short}...`;
                      window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                  >
                    Contatar Cliente
                  </Button>
                </div>
              </Card>
            );
            })}
          </div>
        )}
      </main>
      </div>
      
      {/* Print Configuration Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Impressão</DialogTitle>
            <DialogDescription>
              Ajuste o tamanho da fonte e largura do papel e veja o preview
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Configuration Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">Configurações</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="fontSize">Tamanho da Fonte</Label>
                <Select value={printFontSize} onValueChange={setPrintFontSize}>
                  <SelectTrigger id="fontSize">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Pequena (10px)</SelectItem>
                    <SelectItem value="12">Média (12px)</SelectItem>
                    <SelectItem value="14">Grande (14px)</SelectItem>
                    <SelectItem value="16">Muito Grande (16px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="paperWidth">Largura do Papel</Label>
                <Select value={printWidth} onValueChange={setPrintWidth}>
                  <SelectTrigger id="paperWidth">
                    <SelectValue placeholder="Selecione a largura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="250">Estreito (250px)</SelectItem>
                    <SelectItem value="300">Padrão (300px)</SelectItem>
                    <SelectItem value="350">Largo (350px)</SelectItem>
                    <SelectItem value="400">Muito Largo (400px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Preview Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg mb-4">Preview</h3>
              <div className="border rounded-lg p-4 bg-white overflow-auto max-h-[500px]">
                {selectedOrder && (
                  <div 
                    className="mx-auto bg-white"
                    style={{ 
                      maxWidth: `${printWidth}px`,
                      fontFamily: "'Courier New', monospace",
                      fontSize: `${printFontSize}px`
                    }}
                  >
                    <div className="text-center border-b-2 border-dashed border-black pb-3 mb-4">
                      <h1 className="font-bold mb-1" style={{ fontSize: `${parseInt(printFontSize) + 6}px` }}>
                        DeliveryApp
                      </h1>
                      <p style={{ fontSize: `${printFontSize}px` }}>COMPROVANTE DE PEDIDO</p>
                    </div>
                    
                    <div className="mb-4 pb-3 border-b border-dashed border-gray-400">
                      <div className="font-bold uppercase mb-1" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                        Pedido
                      </div>
                      <div className="mb-2" style={{ fontSize: `${parseInt(printFontSize) + 1}px` }}>
                        #{selectedOrder.id.substring(0, 8)}
                      </div>
                      <div className="font-bold uppercase mb-1" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                        Data/Hora
                      </div>
                      <div className="mb-2" style={{ fontSize: `${parseInt(printFontSize) + 1}px` }}>
                        {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                      </div>
                      <div className="font-bold uppercase mb-1" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                        Status
                      </div>
                      <div className="mb-2" style={{ fontSize: `${parseInt(printFontSize) + 1}px` }}>
                        {getStatusLabel(selectedOrder.status)}
                      </div>
                    </div>
                    
                    <div className="mb-4 pb-3 border-b border-dashed border-gray-400">
                      <div className="font-bold uppercase mb-1" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                        Cliente
                      </div>
                      <div className="mb-2" style={{ fontSize: `${parseInt(printFontSize) + 1}px` }}>
                        {selectedOrder.customer_name}
                      </div>
                      <div className="font-bold uppercase mb-1" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                        Telefone
                      </div>
                      <div className="mb-2" style={{ fontSize: `${parseInt(printFontSize) + 1}px` }}>
                        {selectedOrder.customer_phone}
                      </div>
                      <div className="font-bold uppercase mb-1" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                        Endereço de Entrega
                      </div>
                      <div className="mb-2" style={{ fontSize: `${parseInt(printFontSize) + 1}px` }}>
                        {selectedOrder.delivery_address}
                      </div>
                    </div>
                    
                    <div className="mb-4 pb-3 border-b-2 border-dashed border-black">
                      <div className="font-bold uppercase mb-2" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                        Itens do Pedido
                      </div>
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between my-1" style={{ fontSize: `${printFontSize}px` }}>
                          <span>{item.quantity}x {item.product_name}</span>
                          <span>R$ {(item.quantity * item.product_price).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold mt-3" style={{ fontSize: `${parseInt(printFontSize) + 4}px` }}>
                        <span>TOTAL</span>
                        <span>R$ {selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="text-center mt-4" style={{ fontSize: `${parseInt(printFontSize) - 1}px` }}>
                      Obrigado pela preferência!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => selectedOrder && printOrder(selectedOrder, printFontSize, printWidth)}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
