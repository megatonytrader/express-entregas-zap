import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MessageCircle } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminWhatsApp = () => {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
        .in("key", ["whatsapp_number", "whatsapp_notifications"]);

      if (error) throw error;

      if (data) {
        const whatsapp = data.find((s) => s.key === "whatsapp_number");
        const notifications = data.find((s) => s.key === "whatsapp_notifications");
        
        if (whatsapp) setWhatsappNumber(whatsapp.value || "");
        if (notifications) setNotificationsEnabled(notifications.value === "true");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save WhatsApp number
      const { error: whatsappError } = await supabase
        .from("settings")
        .upsert(
          { key: "whatsapp_number", value: whatsappNumber },
          { onConflict: "key" }
        );

      if (whatsappError) throw whatsappError;

      // Save notifications setting
      const { error: notifError } = await supabase
        .from("settings")
        .upsert(
          { key: "whatsapp_notifications", value: notificationsEnabled.toString() },
          { onConflict: "key" }
        );

      if (notifError) throw notifError;

      toast({
        title: "WhatsApp configurado",
        description: "As configurações do WhatsApp foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
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
                <MessageCircle className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Configuração WhatsApp</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configuração de WhatsApp</h1>
            <p className="text-muted-foreground">Configure o WhatsApp para notificações</p>
          </div>

          <Card className="p-6 max-w-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+55 (00) 00000-0000"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Digite o número com DDD para receber notificações de pedidos
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Pedidos</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas no WhatsApp quando houver novos pedidos
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
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

export default AdminWhatsApp;
