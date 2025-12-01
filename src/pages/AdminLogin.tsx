import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const success = login(password);
      
      if (success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao painel administrativo",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Senha incorreta",
          description: "Por favor, tente novamente",
          variant: "destructive",
        });
      }
      
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground text-center">
            Digite a senha para acessar o painel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Senha padrão: <code className="bg-muted px-2 py-1 rounded">admin123</code>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
