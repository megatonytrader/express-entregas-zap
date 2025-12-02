import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminCompanySettings = () => {
  const [title, setTitle] = useState("");
  const [slogan, setSlogan] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .in("key", ["company_title", "company_slogan"]);

      if (error) throw error;

      if (data) {
        const companyTitle = data.find((s) => s.key === "company_title");
        const companySlogan = data.find((s) => s.key === "company_slogan");
        
        if (companyTitle) setTitle(companyTitle.value || "");
        if (companySlogan) setSlogan(companySlogan.value || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const settingsToUpsert = [
        { key: "company_title", value: title },
        { key: "company_slogan", value: slogan },
      ];

      const { error } = await supabase
        .from("settings")
        .upsert(settingsToUpsert, { onConflict: "key" });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As informações da empresa foram atualizadas.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                <Building className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Configuração da Empresa</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configuração da Empresa</h1>
            <p className="text-muted-foreground">Altere o título e o slogan da sua loja</p>
          </div>

          <Card className="p-6 max-w-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Loja</Label>
                <Input
                  id="title"
                  placeholder="Ex: Churrascaria do Sabor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Este será o nome principal exibido na loja.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan</Label>
                <Input
                  id="slogan"
                  placeholder="Ex: O melhor churrasco da cidade"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Uma frase curta que descreve seu negócio.
                </p>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminCompanySettings;