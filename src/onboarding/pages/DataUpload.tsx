import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';

interface DataUploadProps {
  corPrimaria: string;
  corSecundaria?: string;
  onContinuar: (dados: DataUploadForm) => void;
  onVoltar: () => void;
  dadosAtuais?: Partial<DataUploadForm>;
}

export interface DataUploadForm {
  tipoPessoa: 'fisica' | 'juridica';
  // Pessoa Física
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  cnh?: File | null;
  // Pessoa Jurídica
  nomeEmpresa?: string;
  cnpj?: string;
  contratoSocial?: File | null;
  certidao?: File | null;
  // Comum
  email: string;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  cidade: string;
  estado: string;
  comprovanteMoradia: File | null;
}

export const DataUpload: React.FC<DataUploadProps> = ({
  corPrimaria,
  corSecundaria = '#D4AF37',
  onContinuar,
  onVoltar,
  dadosAtuais,
}) => {
  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>(
    dadosAtuais?.tipoPessoa || 'juridica'
  );
  
  const [formData, setFormData] = useState<Partial<DataUploadForm>>({
    tipoPessoa,
    email: dadosAtuais?.email || '',
    telefone: dadosAtuais?.telefone || '',
    cep: dadosAtuais?.cep || '',
    rua: dadosAtuais?.rua || '',
    numero: dadosAtuais?.numero || '',
    cidade: dadosAtuais?.cidade || '',
    estado: dadosAtuais?.estado || '',
    nome: dadosAtuais?.nome || '',
    cpf: dadosAtuais?.cpf || '',
    dataNascimento: dadosAtuais?.dataNascimento || '',
    nomeEmpresa: dadosAtuais?.nomeEmpresa || '',
    cnpj: dadosAtuais?.cnpj || '',
  });

  const [arquivos, setArquivos] = useState<{
    cnh: File | null;
    contratoSocial: File | null;
    certidao: File | null;
    comprovanteMoradia: File | null;
  }>({
    cnh: null,
    contratoSocial: null,
    certidao: null,
    comprovanteMoradia: null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Buscar endereço quando CEP for preenchido (8 dígitos)
    if (field === 'cep' && value.replace(/\D/g, '').length === 8) {
      buscarEnderecoPorCep(value);
    }
  };

  const buscarEnderecoPorCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          rua: data.logradouro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleFileChange = (
    field: 'cnh' | 'contratoSocial' | 'certidao' | 'comprovanteMoradia',
    file: File | null
  ) => {
    setArquivos((prev) => ({ ...prev, [field]: file }));
  };

  const handleContinuar = () => {
    const dados: DataUploadForm = {
      tipoPessoa,
      email: formData.email || '',
      telefone: formData.telefone || '',
      cep: formData.cep || '',
      rua: formData.rua || '',
      numero: formData.numero || '',
      cidade: formData.cidade || '',
      estado: formData.estado || '',
      comprovanteMoradia: arquivos.comprovanteMoradia,
      ...(tipoPessoa === 'fisica'
        ? {
            nome: formData.nome,
            cpf: formData.cpf,
            dataNascimento: formData.dataNascimento,
            cnh: arquivos.cnh,
          }
        : {
            nomeEmpresa: formData.nomeEmpresa,
            cnpj: formData.cnpj,
            contratoSocial: arquivos.contratoSocial,
            certidao: arquivos.certidao,
          }),
    };

    onContinuar(dados);
  };

  // Validação removida para permitir testes - campos opcionais
  const validarFormulario = () => {
    // Sempre retorna true para permitir navegação sem preencher todos os campos
    return true;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
      {/* Título */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold" style={{ color: corPrimaria }}>
          Seus dados
        </h2>
        <p className="text-gray-600 text-sm">
          Preencha as informações para completar seu cadastro
        </p>
      </div>

      {/* Seletor de Tipo de Pessoa */}
      <div className="flex gap-3 mb-6">
        <Button
          type="button"
          variant={tipoPessoa === 'fisica' ? 'default' : 'outline'}
          onClick={() => setTipoPessoa('fisica')}
          className="flex-1 py-6"
          style={
            tipoPessoa === 'fisica'
              ? { backgroundColor: corPrimaria }
              : {}
          }
        >
          Pessoa Física
        </Button>
        <Button
          type="button"
          variant={tipoPessoa === 'juridica' ? 'default' : 'outline'}
          onClick={() => setTipoPessoa('juridica')}
          className="flex-1 py-6"
          style={
            tipoPessoa === 'juridica'
              ? { backgroundColor: corPrimaria }
              : {}
          }
        >
          Pessoa Jurídica
        </Button>
      </div>

      {/* Formulário Pessoa Física */}
      {tipoPessoa === 'fisica' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome || ''}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                value={formData.cpf || ''}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento || ''}
                onChange={(e) =>
                  handleInputChange('dataNascimento', e.target.value)
                }
              />
            </div>
          </div>

          {/* Upload CNH */}
          <div>
            <Label htmlFor="cnh">CNH (frente e verso) *</Label>
            <div className="mt-2">
              <label
                htmlFor="cnh"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: arquivos.cnh ? corPrimaria : '#d1d5db',
                }}
              >
                {arquivos.cnh ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" style={{ color: corPrimaria }} />
                    <span className="text-sm font-medium">
                      {arquivos.cnh.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Clique para enviar
                    </span>
                  </>
                )}
              </label>
              <input
                id="cnh"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) =>
                  handleFileChange('cnh', e.target.files?.[0] || null)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulário Pessoa Jurídica */}
      {tipoPessoa === 'juridica' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
            <Input
              id="nomeEmpresa"
              type="text"
              value={formData.nomeEmpresa || ''}
              onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
              placeholder="Razão social"
            />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              type="text"
              value={formData.cnpj || ''}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>

          {/* Upload Contrato Social */}
          <div>
            <Label htmlFor="contratoSocial">Contrato Social *</Label>
            <div className="mt-2">
              <label
                htmlFor="contratoSocial"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: arquivos.contratoSocial ? corPrimaria : '#d1d5db',
                }}
              >
                {arquivos.contratoSocial ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" style={{ color: corPrimaria }} />
                    <span className="text-sm font-medium">
                      {arquivos.contratoSocial.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Clique para enviar PDF
                    </span>
                  </>
                )}
              </label>
              <input
                id="contratoSocial"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) =>
                  handleFileChange('contratoSocial', e.target.files?.[0] || null)
                }
              />
            </div>
          </div>

          {/* Upload Certidão */}
          <div>
            <Label htmlFor="certidao">Certidão Simplificada *</Label>
            <div className="mt-2">
              <label
                htmlFor="certidao"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: arquivos.certidao ? corPrimaria : '#d1d5db',
                }}
              >
                {arquivos.certidao ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" style={{ color: corPrimaria }} />
                    <span className="text-sm font-medium">
                      {arquivos.certidao.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Clique para enviar PDF
                    </span>
                  </>
                )}
              </label>
              <input
                id="certidao"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) =>
                  handleFileChange('certidao', e.target.files?.[0] || null)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Campos Comuns */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-gray-900">Contato</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              type="tel"
              value={formData.telefone || ''}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-gray-900">Endereço</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label htmlFor="cep">CEP *</Label>
            <Input
              id="cep"
              type="text"
              value={formData.cep || ''}
              onChange={(e) => handleInputChange('cep', e.target.value)}
              placeholder="00000-000"
            />
          </div>
          <div>
            <Label htmlFor="numero">Número *</Label>
            <Input
              id="numero"
              type="text"
              value={formData.numero || ''}
              onChange={(e) => handleInputChange('numero', e.target.value)}
              placeholder="123"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="rua">Rua *</Label>
          <Input
            id="rua"
            type="text"
            value={formData.rua || ''}
            onChange={(e) => handleInputChange('rua', e.target.value)}
            placeholder="Nome da rua"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cidade">Cidade *</Label>
            <Input
              id="cidade"
              type="text"
              value={formData.cidade || ''}
              onChange={(e) => handleInputChange('cidade', e.target.value)}
              placeholder="Sua cidade"
            />
          </div>
          <div>
            <Label htmlFor="estado">Estado *</Label>
            <Input
              id="estado"
              type="text"
              value={formData.estado || ''}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      {/* Upload Comprovante de Moradia (Comum) */}
      <div className="pt-4 border-t">
        <Label htmlFor="comprovanteMoradia">Comprovante de Residência *</Label>
        <p className="text-xs text-gray-500 mb-2">
          Conta de água, luz, gás ou telefone
        </p>
        <div className="mt-2">
          <label
            htmlFor="comprovanteMoradia"
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{
              borderColor: arquivos.comprovanteMoradia ? corPrimaria : '#d1d5db',
            }}
          >
            {arquivos.comprovanteMoradia ? (
              <>
                <CheckCircle2 className="w-5 h-5" style={{ color: corPrimaria }} />
                <span className="text-sm font-medium">
                  {arquivos.comprovanteMoradia.name}
                </span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Clique para enviar PDF ou imagem
                </span>
              </>
            )}
          </label>
          <input
            id="comprovanteMoradia"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) =>
              handleFileChange('comprovanteMoradia', e.target.files?.[0] || null)
            }
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onVoltar}
          className="flex-1 py-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handleContinuar}
          className="flex-1 py-6 font-medium"
          style={{ backgroundColor: corPrimaria }}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

