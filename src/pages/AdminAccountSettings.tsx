import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, UserPlus, CheckCircle, Copy } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminAccountSettings = () => {
  const { toast } = useToast();
  const { signUp } = useAdminAuth();

  // State for password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // State for new user creation
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [createdUserEmail, setCreatedUserEmail] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      toast({
        title: "Erro ao alterar a senha",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Senha alterada com sucesso!",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);

    const { success, error, user } = await signUp(newUserEmail, newUserPassword);

    if (success && user) {
      setNewUserId(user.id);
      setCreatedUserEmail(user.email || "");
      setSignUpSuccess(true);
      setNewUserEmail("");
      setNewUserPassword("");
    } else {
      toast({
        title: "Falha no cadastro",
        description: error?.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
    setUserLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "O ID do usuário foi copiado para a área de transferência.",
    });
  };

  const resetSignUpForm = () => {
    setSignUpSuccess(false);
    setNewUserId("");
    setCreatedUserEmail("");
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
                <Settings className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Configurações da Conta</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configurações da Conta</h1>
            <p className="text-muted-foreground">Gerencie sua senha e adicione novos administradores</p>
          </div>

          <div className="max-w-2xl space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Alterar Senha</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "Salvando..." : "Salvar Nova Senha"}
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Adicionar Novo Administrador
              </h2>
              
              {signUpSuccess ? (
                <div className="animate-fade-in">
                  <div className="flex flex-col items-center text-center mb-6">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                    <h3 className="text-lg font-bold mb-1">Usuário Criado!</h3>
                    <p className="text-muted-foreground text-sm">
                      O usuário <span className="font-semibold text-primary">{createdUserEmail}</span> foi criado. Agora, o passo final é dar a ele permissão de administrador.
                    </p>
                  </div>
                  <div className="text-left space-y-3 text-sm">
                    <p className="font-semibold">Siga estes passos no seu painel do Supabase:</p>
                    <ol className="list-decimal list-inside space-y-2 bg-muted/50 p-3 rounded-lg">
                      <li>Vá para <strong>Database</strong> &gt; <strong>Tables</strong> e selecione a tabela <strong>user_roles</strong>.</li>
                      <li>Clique em <strong>+ Insert row</strong>.</li>
                      <li>
                        <p>No campo <strong>user_id</strong>, cole o ID abaixo:</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Input readOnly value={newUserId} className="bg-background font-mono text-xs h-8" />
                          <Button variant="outline" size="icon" type="button" onClick={() => copyToClipboard(newUserId)} className="h-8 w-8">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                      <li>No campo <strong>role</strong>, digite exatamente <strong>admin</strong>.</li>
                      <li>Clique em <strong>Save</strong>.</li>
                    </ol>
                  </div>
                  <Button onClick={resetSignUpForm} className="w-full mt-4">
                    Adicionar Outro Usuário
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAddUser} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Isso criará um novo usuário. Você precisará atribuir a ele a permissão de 'admin' manualmente no Supabase.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-email">E-mail do Novo Usuário</Label>
                    <Input
                      id="new-user-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="novo.admin@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-password">Senha Provisória</Label>
                    <Input
                      id="new-user-password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Crie uma senha forte"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={userLoading}>
                    {userLoading ? "Criando..." : "Criar Novo Usuário"}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAccountSettings;