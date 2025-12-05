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
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShoppingCart, Plus, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [newAddOnName, setNewAddOnName] = useState("");
  const [newAddOnPrice, setNewAddOnPrice] = useState("");
  const [isNewAddOnCharged, setIsNewAddOnCharged] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
      loadAddOns();
    } else if (isAdmin === false) {
      navigate("/auth");
    }
  }, [isAdmin, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data: hasRole } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      setIsAdmin(!!hasRole);
    } catch (error) {
      console.error("Error checking admin access:", error);
      setIsAdmin(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", category: "" });
    setSelectedAddOns([]);
    setImageFile(null);
    setImagePreviewUrl(null);
    setEditingId(null);
    setShowForm(false);
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
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAddOns = async () => {
    try {
      const { data, error } = await supabase.from("add_ons").select("*").order("name");
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
      setSelectedAddOns(data?.map((item) => item.add_on_id) || []);
    } catch (error) {
      console.error("Error loading product add-ons:", error);
      setSelectedAddOns([]);
    }
  };

  const handleAddNewAddOn = async () => {
    const trimmedName = newAddOnName.trim();
    if (!trimmedName) {
      toast({ title: "Nome do adicional é obrigatório", variant: "destructive" });
      return;
    }
    const nameExists = addOns.some((addOn) => addOn.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      toast({ title: "Erro: Adicional já existe", description: "Já existe uma opção com este nome.", variant: "destructive" });
      return;
    }
    const price = isNewAddOnCharged ? parseFloat(newAddOnPrice) || 0 : 0;
    if (isNewAddOnCharged && price <= 0) {
      toast({ title: "Preço inválido", description: "O preço deve ser maior que zero se a cobrança estiver ativa.", variant: "destructive" });
      return;
    }
    try {
      const { data: newAddOn, error } = await supabase
        .from("add_ons")
        .insert({ name: trimmedName, price: price })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Adicional criado com sucesso!" });
      setNewAddOnName("");
      setNewAddOnPrice("");
      setIsNewAddOnCharged(false);
      setAddOns((prev) => [...prev, newAddOn].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedAddOns((prev) => [...prev, newAddOn.id]);
    } catch (error: any) {
      console.error("Error creating add-on:", error);
      if (error.code === '23505') { // Supabase code for unique violation
        toast({
          title: "Erro: Adicional já existe",
          description: "Já existe uma opção com este nome. Por favor, escolha outro.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar adicional",
          description: `Não foi possível salvar a nova opção. Erro: ${error.message || 'Erro desconhecido.'}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteAddOn = async (addOnId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta opção? Ela será removida de todos os produtos.")) {
      return;
    }

    try {
      // First, remove associations from products
      await supabase.from("product_add_ons").delete().eq("add_on_id", addOnId);

      // Then, delete the add-on itself
      const { error } = await supabase.from("add_ons").delete().eq("id", addOnId);
      if (error) throw error;

      setAddOns(prev => prev.filter(a => a.id !== addOnId));
      setSelectedAddOns(prev => prev.filter(id => id !== addOnId));
      toast({ title: "Opção excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting add-on:", error);
      toast({ title: "Erro ao excluir opção", variant: "destructive" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast({ title: "Campos obrigatórios", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      let imageUrl = editingId ? (products.find(p => p.id === editingId)?.image_url || null) : null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: imageUrl,
      };

      let productId = editingId;
      if (editingId) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase.from("products").insert(productData).select().single();
        if (error) throw error;
        productId = newProduct.id;
      }

      if (productId) {
        await supabase.from("product_add_ons").delete().eq("product_id", productId);
        if (selectedAddOns.length > 0) {
          const addOnRelations = selectedAddOns.map((addOnId) => ({ product_id: productId, add_on_id: addOnId }));
          await supabase.from("product_add_ons").insert(addOnRelations);
        }
      }

      toast({ title: `Produto ${editingId ? 'atualizado' : 'cadastrado'}!` });
      resetForm();
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ title: "Erro ao salvar produto", variant: "destructive" });
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
    setImagePreviewUrl(product.image_url);
    setImageFile(null);
    await loadProductAddOns(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("product_add_ons").delete().eq("product_id", id);
      await supabase.from("products").delete().eq("id", id);
      setProducts(products.filter((prod) => prod.id !== id));
      toast({ title: "Produto removido" });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Erro ao remover produto", variant: "destructive" });
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) => (prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]));
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p>Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <header className="bg-background border-b border-border sticky top-0 z-10 shadow-soft lg:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Produtos</span>
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
              resetForm();
              setShowForm(true);
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
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço *</Label>
                    <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Combos">Combos</SelectItem>
                        <SelectItem value="Hamburguer">Hamburguer</SelectItem>
                        <SelectItem value="Bebidas">Bebidas</SelectItem>
                        <SelectItem value="Acompanhamentos">Acompanhamentos</SelectItem>
                        <SelectItem value="Pizzas">Pizzas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem do Produto</Label>
                  {imagePreviewUrl ? (
                    <div className="mt-2"><img src={imagePreviewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg" /></div>
                  ) : (
                    <div className="mt-2 flex items-center justify-center w-32 h-32 bg-muted rounded-lg"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
                  )}
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                </div>
                <div className="space-y-3">
                  <Label>Opções / Adicionais</Label>
                  <Collapsible>
                    <CollapsibleTrigger asChild><Button variant="outline" size="sm" className="w-full gap-2"><Plus className="h-4 w-4" />Criar Nova Opção</Button></CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground">Nova Opção</h4>
                        <Input placeholder="Nome (Ex: Bacon extra)" value={newAddOnName} onChange={(e) => setNewAddOnName(e.target.value)} />
                        <div className="flex items-center space-x-2"><Switch id="is-charged" checked={isNewAddOnCharged} onCheckedChange={setIsNewAddOnCharged} /><Label htmlFor="is-charged">Cobrar por esta opção?</Label></div>
                        {isNewAddOnCharged && <Input type="number" placeholder="Preço (Ex: 3.50)" step="0.01" value={newAddOnPrice} onChange={(e) => setNewAddOnPrice(e.target.value)} />}
                        <Button type="button" size="sm" onClick={handleAddNewAddOn} className="w-full">Adicionar e Selecionar</Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  {addOns.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {addOns.map((addOn) => (
                        <div key={addOn.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Checkbox id={`addon-${addOn.id}`} checked={selectedAddOns.includes(addOn.id)} onCheckedChange={() => toggleAddOn(addOn.id)} />
                            <label htmlFor={`addon-${addOn.id}`} className="flex-1 text-sm cursor-pointer truncate">
                              <span className="font-medium">{addOn.name}</span>
                              <span className="text-muted-foreground ml-2">R$ {addOn.price.toFixed(2)}</span>
                            </label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleDeleteAddOn(addOn.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Salvando..." : (editingId ? "Atualizar Produto" : "Salvar Produto")}</Button>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>Cancelar</Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? <p>Carregando produtos...</p> : products.length === 0 ? (
            <Card className="p-12 text-center"><ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold">Nenhum produto cadastrado</h3></Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-4">
                  <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                  <p className="text-xl font-bold text-primary mb-4">R$ {product.price.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}><Pencil className="h-4 w-4 mr-1" />Editar</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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