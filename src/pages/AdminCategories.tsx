import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderTree, Plus, Trash2, Pencil } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Carnes" },
    { id: "2", name: "Acompanhamentos" },
    { id: "3", name: "Bebidas" },
    { id: "4", name: "Fatiado" },
  ]);
  const [newCategory, setNewCategory] = useState("");
  const { toast } = useToast();

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    
    setCategories([...categories, { id: Date.now().toString(), name: newCategory }]);
    setNewCategory("");
    toast({
      title: "Categoria adicionada",
      description: "A categoria foi criada com sucesso",
    });
  };

  const handleDelete = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
    toast({
      title: "Categoria removida",
      description: "A categoria foi excluída com sucesso",
    });
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
                <FolderTree className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Categorias</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Gestão de Categorias</h1>
            <p className="text-muted-foreground">Organize os produtos por categorias</p>
          </div>

          <div className="max-w-2xl space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Adicionar Nova Categoria</h2>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Nome da categoria"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Categorias Existentes</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth"
                  >
                    <span className="font-medium">{category.name}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminCategories;