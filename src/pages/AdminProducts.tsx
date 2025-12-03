import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Plus, Trash2, Pencil } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadAddOns();
  }, []);

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
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAddOns = async () => {
    try {
      const { data, error } = await supabase
        .from("add_ons")
        .select("*")
        .order("name");

      if (error) throw error;
      setAddOns(data || []);
    } catch (error) {
      console.error("Error loading add-ons:", error);
    }
  };

  const loadProductAddOns = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("product_add_ons")
        .select("add_on_id")
        .eq("product_id", productId);

      if (error) throw error;
      setSelectedAddOns(data?.map(item => item.add_on_id) || []);
    } catch (error) {
      console.error("Error loading product add-ons:", error);
      setSelectedAddOns([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, preço e categoria.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = null;
      let productId = editingId;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (editingId) {
        // Update existing product
        const updateData: any = {
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          category: formData.category,
        };

        // Only update image if a new one was uploaded
        if (imageUrl) {
          updateData.image_url = imageUrl;
        }

        const { error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", editingId);

        if (error) throw error;

        // Update product add-ons
        await supabase
          .from("product_add_ons")
          .delete()
          .eq("product_id", editingId);

        if (selectedAddOns.length > 0) {
          const addOnRelations = selectedAddOns.map(addOnId => ({
            product_id: editingId,
            add_on_id: addOnId,
          }));

          const { error: addOnsError } = await supabase
            .from("product_add_ons")
            .insert(addOnRelations);

          if (addOnsError) throw addOnsError;
        }

        toast({
          title: "Produto atualizado!",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        // Insert new product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([
            {
              name: formData.name,
              description: formData.description || null,
              price: parseFloat(formData.price),
              category: formData.category,
              image_url: imageUrl,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;

        // Insert product add-ons
        if (selectedAddOns.length > 0) {
          const addOnRelations = selectedAddOns.map(addOnId => ({
            product_id: productId,
            add_on_id: addOnId,
          }));

          const { error: addOnsError } = await supabase
            .from("product_add_ons")
            .insert(addOnRelations);

          if (addOnsError) throw addOnsError;
        }

        toast({
          title: "Produto cadastrado!",
          description: "O produto foi adicionado com sucesso.",
        });
      }

      // Reset form
      setFormData({ name: "", description: "", price: "", category: "" });
      setSelectedAddOns([]);
      setImageFile(null);
      setShowForm(false);
      setEditingId(null);
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: editingId ? "Erro ao atualizar produto" : "Erro ao cadastrar produto",
        description: editingId ? "Não foi possível atualizar o produto." : "Não foi possível cadastrar o produto.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category,
    });
    setEditingId(product.id);
    await loadProductAddOns(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete product add-ons first
      await supabase
        .from("product_add_ons")
        .delete()
        .eq("product_id", id);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProducts(products.filter(prod => prod.id !== id));
      toast({
        title: "Produto removido",
        description: "O produto foi excluído com sucesso",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
      });
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-background border-b border-border sticky top-0 z-10 shadow-soft lg:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Produtos</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestão de Produtos</h1>
              <p className="text-muted-foreground">Cadastre e gerencie os produtos da loja</p>
            </div>
            <Button onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: "", description: "", price: "", category: "" });
              setSelectedAddOns([]);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          {showForm && (
            <Card className="p-6 mb-6 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">{editingId ? "Editar Produto" : "Novo Produto"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Picanha Nobre"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descrição do produto..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0.00" 
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Espetinho">Espetinho</SelectItem>
                        <SelectItem value="Porções">Porções</SelectItem>
                        <SelectItem value="Bebidas">Bebidas</SelectItem>
                        <SelectItem value="Fatiado">Fatiado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Imagem do Produto</Label>
                  <Input 
                    id="image" 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>

                {addOns.length > 0 && (
                  <div className="space-y-3">
                    <Label>Adicionais Disponíveis</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {addOns.map((addOn) => (
                        <div
                          key={addOn.id}
                          className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`addon-${addOn.id}`}
                            checked={selectedAddOns.includes(addOn.id)}
                            onCheckedChange={() => toggleAddOn(addOn.id)}
                          />
                          <label
                            htmlFor={`addon-${addOn.id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <span className="font-medium">{addOn.name}</span>
                            <span className="text-muted-foreground ml-2">
                              R$ {addOn.price.toFixed(2)}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Salvando..." : (editingId ? "Atualizar Produto" : "Salvar Produto")}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ name: "", description: "", price: "", category: "" });
                      setSelectedAddOns([]);
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado</h3>
              <p className="text-muted-foreground">Clique em "Novo Produto" para adicionar o primeiro produto.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-4">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                  <p className="text-xl font-bold text-primary mb-4">
                    R$ {product.price.toFixed(2)}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminProducts;
