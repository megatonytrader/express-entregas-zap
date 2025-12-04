import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { BottomNav } from "@/components/BottomNav";

const Cart = () => {
  const { items, itemCount, total, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Meu Carrinho</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 pb-24">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-6">
              Adicione produtos para continuar
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/")}
            >
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Itens ({itemCount})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive"
                >
                  Limpar Carrinho
                </Button>
              </div>

              {items.map((item) => {
                const itemAddOnsTotal = (item.selectedAddOns || []).reduce((sum, addOn) => sum + addOn.price, 0);
                const itemTotal = (item.productPrice + itemAddOnsTotal) * item.quantity;

                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex gap-4">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg mb-1 truncate">
                            {item.productName}
                          </h3>
                          {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                            <ul className="text-xs text-muted-foreground list-disc list-inside pl-1">
                              {item.selectedAddOns.map(addOn => (
                                <li key={addOn.id}>{addOn.name} (+ R$ {addOn.price.toFixed(2)})</li>
                              ))}
                            </ul>
                          )}
                          <p className="text-lg sm:text-xl font-bold text-primary mt-2">
                            R$ {item.productPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-3 sm:ml-auto">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 border border-border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="sm:text-right">
                          <p className="font-bold text-base sm:text-lg whitespace-nowrap">
                            R$ {itemTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="p-4 sm:p-6 lg:sticky lg:top-24">
                <h3 className="text-xl font-bold mb-4">Resumo do Pedido</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>R$ 5.00</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        R$ {(total + 5).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  Finalizar Pedido
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Cart;