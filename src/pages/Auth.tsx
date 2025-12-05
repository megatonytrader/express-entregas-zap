import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, Mail } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("E-mail inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

type AuthMode = "login" | "signup" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/admin");
        }
        setCheckingSession(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/admin");
      }
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return false;
    }

    if (mode !== 'reset') {
      try {
        passwordSchema.parse(password);
      } catch (e: any) {
        toast({ title: e.errors?.[0]?.message || "Senha inválida", variant: "destructive" });
        return false;
      }
    }

    if (mode === 'signup' && !nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return false;
    }

    return true;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      emailSchema.parse(email);
    } catch {
      toast({ title: "E-mail inválido", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao redefinir senha",
        description: "Não foi possível enviar o link. Verifique o e-mail e tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Link enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setMode("login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({ 
              title: "E-mail ou senha incorretos", 
              description: "Verifique seus dados ou crie uma conta se for novo por aqui.",
              variant: "destructive" 
            });
          } else if (error.message.includes("Email not confirmed")) {
            toast({
              title: "E-mail não confirmado",
              description: "Por favor, verifique sua caixa de entrada e confirme seu e-mail.",
              variant: "destructive"
            });
          } else {
            toast({ title: "Erro no login", description: error.message, variant: "destructive" });
          }
          return;
        }

        toast({ title: "Login realizado com sucesso!" });
      } else { // mode === 'signup'
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              nome: nome.trim(),
              telefone: telefone.trim() || null,
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({ title: "Este e-mail já está cadastrado", variant: "destructive" });
          } else {
            toast({ title: error.message, variant: "destructive" });
          }
          return;
        }

        toast({ 
          title: "Cadastro realizado!", 
          description: "Verifique seu e-mail para confirmar a conta." 
        });
      }
    } catch (error: any) {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {mode === 'reset' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Redefinir Senha</h1>
              <p className="text-muted-foreground">
                Digite seu e-mail para receber um link de redefinição.
              </p>
            </div>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : <><Mail className="h-4 w-4 mr-2" /> Enviar Link</>}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Lembrou a senha? Voltar para o login
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {mode === 'login' ? "Entrar" : "Criar Conta"}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'login' 
                  ? "Acesse sua conta de administrador" 
                  : "Cadastre-se para acessar o sistema"}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" disabled={loading} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" disabled={loading} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              {mode === 'login' && (
                <div className="text-right -mt-2">
                  <button type="button" onClick={() => setMode('reset')} className="text-sm text-primary hover:underline font-medium" disabled={loading}>
                    Esqueceu a senha?
                  </button>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Carregando..." : mode === 'login' ? <><LogIn className="h-4 w-4 mr-2" /> Entrar</> : <><UserPlus className="h-4 w-4 mr-2" /> Cadastrar</>}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-primary hover:underline" disabled={loading}>
                {mode === 'login' ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Auth;