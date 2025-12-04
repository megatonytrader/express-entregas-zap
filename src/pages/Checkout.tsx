import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, total, clearCart } = useCart();
  const { settings } = useSettings();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    payment: "money",
  });

  useEffect(() => {
    loadWhatsAppNumber();
  }, []);

  const loadWhatsAppNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        // Remove formatting from number
        const cleanNumber = data.value.replace(/\D/g, "");
        setWhatsappNumber(cleanNumber);
      }
    } catch (error) {
      console.error("Error loading WhatsApp number:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!whatsappNumber) {
      toast({
        title: "Erro",
        description: "O número do WhatsApp não está configurado. Entre em contato com a loja.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user (optional)
      const { data: { user } } = await supabase.auth.getUser();

      const deliveryFee = 5;
      const orderTotal = total + deliveryFee;
      const fullAddress = `${formData.address}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''} - ${formData.neighborhood}`;

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          customer_name: formData.name,
          customer_phone: formData.phone,
          delivery_address: fullAddress,
          payment_method: formData.payment === 'money' ? 'Dinheiro' : 'Cartão na Entrega',
          total: orderTotal,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        product_price: item.productPrice,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Criar lista de itens do pedido
      const itemsList = items
        .map(
          (item) =>
            `• ${item.quantity}x ${item.productName} - R$ ${(item.productPrice * item.quantity).toFixed(2)}`
        )
        .join("\n");

      // Criar mensagem para WhatsApp
      const message = `
🛍️ *Novo Pedido #${order.id.substring(0, 8)}*

👤 *Cliente:* ${formData.name}
📱 *Telefone:* ${formData.phone}

📦 *Itens do Pedido:*
${itemsList}

💰 *Subtotal:* R$ ${total.toFixed(2)}
🚚 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}
💵 *Total:* R$ ${orderTotal.toFixed(2)}

📍 *Endereço de Entrega:*
${fullAddress}

💳 *Forma de Pagamento:* ${formData.payment === 'money' ? 'Dinheiro' : 'Cartão na Entrega'}

✅ Aguardando confirmação!
      `.trim();

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Limpar carrinho
      clearCart();
      
      toast({
        title: "Pedido enviado!",
        description: "Seu pedido foi salvo e você será redirecionado para o WhatsApp.",
      });
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro ao criar pedido",
        description: "Não foi possível salvar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">{settings.companyTitle}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dados Pessoais</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (com DDD)</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Endereço de Entrega</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Rua/Avenida</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nome da rua"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Apto, Bloco..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  required
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Nome do bairro"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Forma de Pagamento</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-smooth">
                <input
                  type="radio"
                  name="payment"
                  value="money"
                  checked={formData.payment === "money"}
                  onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="font-medium">Dinheiro</span>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-smooth">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={formData.payment === "card"}
                  onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="font-medium">Cartão na Entrega</span>
              </label>
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full">
            Enviar Pedido via WhatsApp
          </Button>
        </form>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Checkout;