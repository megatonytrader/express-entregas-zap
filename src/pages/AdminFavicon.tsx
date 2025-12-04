import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Upload } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminFavicon = () => {
  const [faviconPreview, setFaviconPreview] = useState<string>("/favicon.ico");
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentFavicon();
  }, []);

  const loadCurrentFavicon = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "favicon_url")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        setFaviconPreview(data.value);
      }
    } catch (error) {
      console.error("Erro ao carregar favicon:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!faviconFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const fileExt = faviconFile.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, faviconFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const faviconUrl = urlData.publicUrl;

      const { error: upsertError } = await supabase
        .from("settings")
        .upsert({ key: "favicon_url", value: faviconUrl }, { onConflict: "key" });

      if (upsertError) throw upsertError;

      toast({
        title: "Favicon atualizado",
        description: "O favicon da loja foi atualizado com sucesso",
      });
      
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (link) {
        link.href = faviconUrl;
      } else {
        link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        document.head.appendChild(link);
      }

    } catch (error) {
      console.error("Erro ao salvar favicon:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o favicon",
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
                <Star className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Configuração de Favicon</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configuração de Favicon</h1>
            <p className="text-muted-foreground">Configure o ícone da aba do navegador</p>
          </div>

          <Card className="p-6 max-w-2xl">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted/30">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon">Upload do Favicon</Label>
                <Input
                  id="favicon"
                  type="file"
                  accept="image/png, image/x-icon, image/svg+xml"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground">
                  Recomendamos uma imagem quadrada (.ico, .png, .svg) com pelo menos 32x32 pixels. Tamanhos maiores como 192x192 ou 512x512 pixels são ideais para garantir a qualidade em todos os dispositivos.
                </p>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Favicon"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminFavicon;