import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { BottomNav } from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import bebidaIcon from "@/assets/bebida-icon.png";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
}

const Index = () => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");

  const categories = [
    { id: "Lanches", name: "Hamburguer", icon: "🍔" },
    { id: "Bebidas", name: "Bebidas", icon: "🥤", imageIcon: bebidaIcon },
    { id: "Porções", name: "Porções", icon: "🍟" },
    { id: "Combos", name: "Combos", icon: "🎁" },
  ];

  useEffect(() => {
    loadProducts();
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "logo_url")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        setLogoUrl(data.value);
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o cardápio.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mx-auto">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-24 w-auto object-contain"
                />
              )}
              <span className="text-xl font-bold">DeliveryApp</span>
            </div>
          </div>
        </div>
        
        {/* Fixed Categories Menu */}
        <div className="border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap"
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  {category.imageIcon ? (
                    <img src={category.imageIcon} alt={category.name} className="w-5 h-5 mr-1 object-contain" />
                  ) : (
                    <span className="mr-1">{category.icon}</span>
                  )}
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            Delivery Rápido e Saboroso
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90 animate-slide-up">
            Peça agora e receba em até 30 minutos
          </p>
          <Button asChild size="lg" variant="secondary" className="shadow-medium">
            <a href="#menu">Ver Cardápio</a>
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="text-2xl font-bold mb-6 text-center">Categorias</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              className={`p-6 text-center cursor-pointer hover:shadow-medium transition-smooth hover:scale-105 ${
                selectedCategory === category.id ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
            >
              {category.imageIcon ? (
                <img src={category.imageIcon} alt={category.name} className="w-16 h-16 mx-auto mb-2 object-contain" />
              ) : (
                <div className="text-4xl mb-2">{category.icon}</div>
              )}
              <p className="font-semibold">{category.name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="menu" className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Nosso Cardápio</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum produto disponível</h3>
            <p className="text-muted-foreground">
              {selectedCategory
                ? "Não há produtos nesta categoria."
                : "Aguarde enquanto adicionamos produtos ao cardápio."}
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-medium transition-smooth group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-smooth"
                  />
                  <Badge className="absolute top-3 right-3 bg-accent shadow-soft">
                    {product.category}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() =>
                        addItem({
                          productId: product.id,
                          productName: product.name,
                          productPrice: product.price,
                          productImage: product.image_url || "/placeholder.svg",
                        })
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border mt-16 pb-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            © 2024 DeliveryApp. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;