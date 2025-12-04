import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, AddOn } from "@/hooks/useCart";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface ProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDialog({ product, open, onOpenChange }: ProductDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    if (product) {
      // Reset state when product changes
      setQuantity(1);
      setSelectedAddOns([]);
      
      // Fetch available add-ons for this product
      const fetchAddOns = async () => {
        const { data: productAddOnIds, error: productAddOnError } = await supabase
          .from("product_add_ons")
          .select("add_on_id")
          .eq("product_id", product.id);

        if (productAddOnError) {
          console.error("Error fetching product add-on relations:", productAddOnError);
          return;
        }

        if (productAddOnIds && productAddOnIds.length > 0) {
          const addOnIds = productAddOnIds.map(item => item.add_on_id);
          const { data: addOns, error: addOnsError } = await supabase
            .from("add_ons")
            .select("*")
            .in("id", addOnIds);
          
          if (addOnsError) {
            console.error("Error fetching add-ons:", addOnsError);
            return;
          }
          setAvailableAddOns(addOns || []);
        } else {
          setAvailableAddOns([]);
        }
      };

      fetchAddOns();
    }
  }, [product]);

  if (!product) return null;

  const handleAddOnToggle = (addOn: AddOn) => {
    setSelectedAddOns(prev => 
      prev.some(a => a.id === addOn.id)
        ? prev.filter(a => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  const calculateTotalPrice = () => {
    const addOnsPrice = selectedAddOns.reduce((total, addOn) => total + addOn.price, 0);
    return (product.price + addOnsPrice) * quantity;
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.image_url || "/placeholder.svg",
      quantity,
      selectedAddOns,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>
        
        {availableAddOns.length > 0 && (
          <div className="py-4">
            <h4 className="font-semibold mb-2">Adicionais</h4>
            <div className="space-y-2">
              {availableAddOns.map(addOn => (
                <div key={addOn.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`addon-${addOn.id}`}
                      onCheckedChange={() => handleAddOnToggle(addOn)}
                      checked={selectedAddOns.some(a => a.id === addOn.id)}
                    />
                    <Label htmlFor={`addon-${addOn.id}`} className="cursor-pointer">
                      {addOn.name}
                    </Label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    + R$ {addOn.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-bold text-lg w-8 text-center">{quantity}</span>
            <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">
              R$ {calculateTotalPrice().toFixed(2)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAddToCart} className="w-full">
            Adicionar ao Carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}