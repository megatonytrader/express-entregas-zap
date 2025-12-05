import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const passwordSchema = z.string().min(6, "A senha deve ter no mínimo 6 caracteres");

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This event is triggered when the user is in the password recovery flow.
        // You can add logic here if needed when the view loads.
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch (err: any) {
      toast({ title: err.errors?.[0]?.message || "Senha inválida", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao atualizar senha", description: "O link pode ter expirado. Tente solicitar um novo.", variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada com sucesso!", description: "Você já pode fazer login com sua nova senha." });
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Crie uma Nova Senha</h1>
          <p className="text-muted-foreground">Digite sua nova senha abaixo.</p>
        </div>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <Label htmlFor="password">Nova Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar Senha"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default UpdatePassword;