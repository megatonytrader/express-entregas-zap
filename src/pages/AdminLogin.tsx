import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShoppingBag, Mail, UserPlus, CheckCircle, Copy } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const { login, signUp } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success, error } = await login(email, password);
    
    if (success) {
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao painel administrativo",
      });
      navigate("/admin");
    } else {
      console.error("Login error:", error);
      toast({
        title: "Falha no login",
        description: "Verifique seu e-mail e senha e tente novamente.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success, error, user } = await signUp(email, password);

    if (success && user) {
      setNewUserId(user.id);
      setNewUserEmail(user.email || "");
      setSignUpSuccess(true);
    } else {
      console.error("Sign up error:", error);
      toast({
        title: "Falha no cadastro",
        description: error?.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "O ID do usuário foi copiado para a área de transferência.",
    });
  };

  const resetToLogin = () => {
    setSignUpSuccess(false);
    setIsSignUp(false);
    setEmail("");
    setPassword("");
    setNewUserId("");
    setNewUserEmail("");
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8 animate-scale-in">
          <div className="flex flex-col items-center text-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Cadastro Realizado!</h1>
            <p className="text-muted-foreground">
              O usuário <span className="font-semibold text-primary">{newUserEmail}</span> foi criado. Agora, o passo final é dar a ele permissão de administrador.
            </p>
          </div>

          <div className="text-left space-y-4 text-sm">
            <p className="font-semibold">Siga estes passos no seu painel do Supabase:</p>
            <ol className="list-decimal list-inside space-y-2 bg-muted/50 p-4 rounded-lg">
              <li>Vá para <strong>Database</strong> &gt; <strong>Tables</strong> e selecione a tabela <strong>user_roles</strong>.</li>
              <li>Clique em <strong>+ Insert row</strong>.</li>
              <li>
                <p>No campo <strong>user_id</strong>, cole o ID abaixo:</p>
                <div className="flex items-center gap-2 mt-1">
                  <Input readOnly value={newUserId} className="bg-background font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(newUserId)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
              <li>No campo <strong>role</strong>, digite exatamente <strong>admin</strong>.</li>
              <li>Clique em <strong>Save</strong>.</li>
            </ol>
            <p className="text-muted-foreground text-xs">
              Este passo é necessário por segurança, para garantir que apenas usuários autorizados possam se tornar administradores.
            </p>
          </div>

          <Button onClick={resetToLogin} className="w-full mt-6">
            Entendi, voltar para o Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {isSignUp ? <UserPlus className="h-8 w-8 text-primary" /> : <ShoppingBag className="h-8 w-8 text-primary" />}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isSignUp ? "Criar Conta de Admin" : "Painel Administrativo"}
          </h1>
          <p className="text-muted-foreground text-center">
            {isSignUp ? "Crie um novo usuário para gerenciar a loja." : "Acesse com suas credenciais de administrador"}
          </p>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isSignUp ? "Cadastrando..." : "Entrando...") : (isSignUp ? "Cadastrar" : "Entrar")}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="link" onClick={toggleForm}>
            {isSignUp ? "Já tem uma conta? Fazer Login" : "Não tem uma conta? Cadastrar"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;