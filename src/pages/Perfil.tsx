import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Calendar, Phone, MapPin, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ProfileData {
  nome: string;
  email: string;
  telefone: string;
  cpf_cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  titular_conta: string;
  chave_pix: string;
  tipo_pessoa: "fisica" | "juridica";
}

const Perfil = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "corrente",
    titular_conta: "",
    chave_pix: "",
    tipo_pessoa: "fisica",
  });

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      if (!user?.id) throw new Error("User not found");
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("✓ Perfil atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao atualizar perfil"),
  });

  const handleEditClick = () => {
    if (profile) {
      setFormData({
        nome: profile.nome || "",
        email: user?.email || "",
        telefone: profile.telefone || "",
        cpf_cnpj: profile.cpf_cnpj || "",
        endereco: profile.endereco || "",
        cidade: profile.cidade || "",
        estado: profile.estado || "",
        cep: profile.cep || "",
        banco: profile.banco || "",
        agencia: profile.agencia || "",
        conta: profile.conta || "",
        tipo_conta: profile.tipo_conta || "corrente",
        titular_conta: profile.titular_conta || "",
        chave_pix: profile.chave_pix || "",
        tipo_pessoa: profile.tipo_pessoa || "fisica",
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.cpf_cnpj) {
      toast.error("CPF/CNPJ é obrigatório");
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-yellow-400">Perfil</h1>
          <p className="text-blue-100 text-sm mt-1">Gerencie suas informações pessoais e bancárias</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Avatar Card */}
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={user?.email || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-900 to-blue-800 text-white text-2xl font-serif">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-serif font-bold text-blue-900">
                    {profile?.nome || user?.user_metadata?.nome || "Usuário"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Membro desde{" "}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("pt-BR")
                      : "data desconhecida"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isEditing ? (
            <>
              {/* View Mode */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif text-blue-900">
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nome</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {profile?.nome || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-sm text-gray-900 font-medium">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Telefone</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {profile?.telefone || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">CPF/CNPJ</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {profile?.cpf_cnpj || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif text-blue-900">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Endereço</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {profile?.endereco || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Cidade</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.cidade || "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Estado</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.estado || "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">CEP</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.cep || "Não informado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif text-blue-900">
                    Informações Bancárias
                  </CardTitle>
                  <CardDescription>Para recebimento de comissões</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Banco</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {profile?.banco || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Agência</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.agencia || "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Conta</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.conta || "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">Tipo de Conta</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.tipo_conta === "corrente" ? "Corrente" : "Poupança"}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-600">Titular da Conta</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.titular_conta || "Não informado"}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-600">Chave PIX</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile?.chave_pix || "Não informado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={handleEditClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-6"
                >
                  Editar Perfil
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif text-blue-900">
                    Editando Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tipo de Pessoa */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Pessoa</Label>
                    <select
                      name="tipo_pessoa"
                      value={formData.tipo_pessoa || "fisica"}
                      onChange={handleChange}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="fisica">Pessoa Física</option>
                      <option value="juridica">Pessoa Jurídica</option>
                    </select>
                  </div>

                  {/* Personal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Nome *</Label>
                      <Input
                        name="nome"
                        value={formData.nome || ""}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="mt-2 bg-gray-100"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                      <Input
                        name="telefone"
                        value={formData.telefone || ""}
                        onChange={handleChange}
                        placeholder="(11) 99999-9999"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">CPF/CNPJ *</Label>
                      <Input
                        name="cpf_cnpj"
                        value={formData.cpf_cnpj || ""}
                        onChange={handleChange}
                        placeholder="000.000.000-00"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-4">Endereço</h4>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Rua/Avenida</Label>
                        <Input
                          name="endereco"
                          value={formData.endereco || ""}
                          onChange={handleChange}
                          placeholder="Rua ou Avenida"
                          className="mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Cidade</Label>
                          <Input
                            name="cidade"
                            value={formData.cidade || ""}
                            onChange={handleChange}
                            placeholder="São Paulo"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Estado</Label>
                          <Input
                            name="estado"
                            value={formData.estado || ""}
                            onChange={handleChange}
                            placeholder="SP"
                            maxLength={2}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">CEP</Label>
                          <Input
                            name="cep"
                            value={formData.cep || ""}
                            onChange={handleChange}
                            placeholder="00000-000"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Info */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-4">Informações Bancárias</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Banco</Label>
                          <Input
                            name="banco"
                            value={formData.banco || ""}
                            onChange={handleChange}
                            placeholder="Ex: Itaú, Bradesco, etc"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Agência</Label>
                          <Input
                            name="agencia"
                            value={formData.agencia || ""}
                            onChange={handleChange}
                            placeholder="0000"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Conta</Label>
                          <Input
                            name="conta"
                            value={formData.conta || ""}
                            onChange={handleChange}
                            placeholder="0000000-0"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Tipo de Conta</Label>
                          <select
                            name="tipo_conta"
                            value={formData.tipo_conta || "corrente"}
                            onChange={handleChange}
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="corrente">Corrente</option>
                            <option value="poupanca">Poupança</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Titular da Conta
                        </Label>
                        <Input
                          name="titular_conta"
                          value={formData.titular_conta || ""}
                          onChange={handleChange}
                          placeholder="Nome do titular"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Chave PIX (Opcional)</Label>
                        <Input
                          name="chave_pix"
                          value={formData.chave_pix || ""}
                          onChange={handleChange}
                          placeholder="Email, CPF, Telefone ou Chave Aleatória"
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg py-2"
                    >
                      {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Perfil;
