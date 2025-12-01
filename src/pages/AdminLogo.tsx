import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Upload } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLogo = () => {
  const [logoPreview, setLogoPreview] = useState<string>("/placeholder.svg");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentLogo();
  }, []);

  const loadCurrentLogo = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "logo_url")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        setLogoPreview(data.value);
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!logoFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload da imagem para o Supabase Storage
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;

      // Verificar se já existe uma configuração de logo
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("id")
        .eq("key", "logo_url")
        .maybeSingle();

      if (existingSettings) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from("settings")
          .update({ value: logoUrl, updated_at: new Date().toISOString() })
          .eq("key", "logo_url");

        if (updateError) throw updateError;
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from("settings")
          .insert({ key: "logo_url", value: logoUrl });

        if (insertError) throw insertError;
      }

      toast({
        title: "Logo atualizado",
        description: "O logo da loja foi atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar logo:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o logo",
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
                <Image className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Configuração de Logo</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configuração de Logo</h1>
            <p className="text-muted-foreground">Configure o logo da sua loja</p>
          </div>

          <Card className="p-6 max-w-2xl">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted/30">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Upload do Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground">
                  Recomendamos uma imagem PNG com fundo transparente
                </p>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Logo"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminLogo;
