import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar } from "lucide-react";

const Perfil = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Seus dados cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" alt={user?.email || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user?.user_metadata?.nome || "Usuário"}</h3>
                <p className="text-sm text-muted-foreground">Contador de Elite</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Nome</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.user_metadata?.nome || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Membro desde</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("pt-BR")
                      : "Não informado"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline">Editar Perfil</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
