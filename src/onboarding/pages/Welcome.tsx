import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Shield, Clock, CheckCircle2, FileCheck } from 'lucide-react';

interface WelcomeProps {
  contadorNome: string;
  corPrimaria: string;
  corSecundaria?: string;
  onContinuar: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({
  contadorNome,
  corPrimaria,
  corSecundaria = '#D4AF37',
  onContinuar,
}) => {
  const beneficios = [
    {
      icon: <Zap className="w-5 h-5" />,
      titulo: 'Rápido e Simples',
      descricao: 'Cadastro em menos de 5 minutos',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      titulo: 'Seguro',
      descricao: 'Seus dados são protegidos com criptografia',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
      {/* Hero Section - Título e Subtítulo */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br rounded-2xl mb-4 shadow-lg" style={{ backgroundImage: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria}40 100%)` }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: corSecundaria }} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: corPrimaria }}>
          Bem-vindo ao Lovable-Celite!
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-md mx-auto">
          Indicação de <strong>{contadorNome}</strong>
        </p>
        <p className="text-sm md:text-base text-gray-700 max-w-md mx-auto font-medium">
          Amplie sua infraestrutura contábil com serviços de escritório virtual premium
        </p>
      </div>

      {/* Cartão de Benefício do Contador Indicador */}
      <div 
        className="rounded-xl p-4 md:p-5 border-l-4"
        style={{
          background: `rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.05)`,
          borderLeftColor: corPrimaria,
        }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-lg"
            style={{ backgroundColor: corSecundaria }}
          >
            ✓
          </div>
          <div>
            <h3 className="font-semibold mb-1" style={{ color: corPrimaria }}>
              Serviço Integrado
            </h3>
            <p className="text-sm text-gray-700">
              Seu escritório virtual é parte integrante do serviço contábil de <strong>{contadorNome}</strong>, expandindo sua capacidade profissional com infraestrutura e credibilidade.
            </p>
          </div>
        </div>
      </div>

      {/* Benefícios em Cards Modernos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          className="rounded-xl p-5 border"
          style={{
            background: `rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.08)`,
            borderColor: `rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.2)`,
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: corPrimaria }}
            >
              <Zap className="w-5 h-5" style={{ color: corSecundaria }} />
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: corPrimaria }}>Rápido e Simples</h3>
              <p className="text-sm text-gray-600">Cadastro em menos de 5 minutos</p>
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl p-5 border"
          style={{
            background: `rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.1)`,
            borderColor: `rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.3)`,
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: corSecundaria }}
            >
              <Shield className="w-5 h-5" style={{ color: corPrimaria }} />
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: corPrimaria }}>100% Seguro</h3>
              <p className="text-sm text-gray-600">Seus dados protegidos com criptografia</p>
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl p-5 border sm:col-span-2"
          style={{
            background: `rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.08)`,
            borderColor: `rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.3)`,
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundImage: `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}dd 100%)` }}
            >
              <Clock className="w-5 h-5" style={{ color: corSecundaria }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: corPrimaria }}>Tempo Estimado</h3>
              <p className="text-sm text-gray-600">Todo o processo leva entre 3 a 5 minutos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documentos Necessários - Design Melhorado */}
      <div 
        className="rounded-xl p-5 md:p-6 border-2 shadow-sm"
        style={{
          background: `linear-gradient(135deg, rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.15) 0%, rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.1) 50%, rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.08) 100%)`,
          borderColor: `rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.4)`,
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <FileCheck className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: corPrimaria }} />
          <div className="flex-1">
            <h3 className="text-base font-bold mb-1" style={{ color: corPrimaria }}>
              Documentos Necessários
            </h3>
            <p className="text-xs text-gray-600">
              Selecione abaixo o tipo de cadastro e veja o que será necessário
            </p>
          </div>
        </div>

        {/* Tabs para PF/PJ */}
        <div className="space-y-4">
          {/* Pessoa Física */}
          <div 
            className="bg-white rounded-lg p-4 border"
            style={{ borderColor: `rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.2)` }}
          >
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: corPrimaria }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: corPrimaria }}></div>
              Pessoa Física
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>RG (frente e verso)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>CPF</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>Comprovante de residência</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>Dados pessoais completos</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Método de pagamento (Stripe)</span>
              </li>
            </ul>
          </div>

          {/* Pessoa Jurídica */}
          <div 
            className="bg-white rounded-lg p-4 border"
            style={{ borderColor: `rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.2)` }}
          >
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: corPrimaria }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: corSecundaria }}></div>
              Pessoa Jurídica
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>Contrato social</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>Cartão CNPJ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>RG e CPF do sócio</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: corSecundaria }} />
                <span>Comprovante de residência do sócio</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Dados de contato da empresa</span>
              </li>
              <li className="flex items-center gap-2 sm:col-span-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Método de pagamento (Stripe)</span>
              </li>
              <li className="sm:col-span-2 text-xs italic mt-1" style={{ color: `rgba(${parseInt(corPrimaria.slice(1,3), 16)}, ${parseInt(corPrimaria.slice(3,5), 16)}, ${parseInt(corPrimaria.slice(5,7), 16)}, 0.7)` }}>
                * Se tiver mais de um sócio, enviar documentos de todos
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botão CTA Principal */}
      <div className="pt-4">
        <Button
          onClick={onContinuar}
          className="w-full py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: corPrimaria }}
        >
          Começar Cadastro Agora
        </Button>
      </div>

      {/* Termos - Mais sutil */}
      <p className="text-xs text-center text-gray-500">
        Ao continuar, você concorda com nossos{' '}
        <a href="#" className="underline hover:text-gray-700 font-medium">
          termos de serviço
        </a>{' '}
        e{' '}
        <a href="#" className="underline hover:text-gray-700 font-medium">
          política de privacidade
        </a>
      </p>
    </div>
  );
};

