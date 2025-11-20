import React from 'react';
import { CheckCircle2, Mail, Calendar, CreditCard } from 'lucide-react';

interface SuccessProps {
  corPrimaria: string;
  corSecundaria?: string;
  nomeCliente: string;
  email: string;
  plano: string;
  valorPlano: number;
  contadorNome: string;
}

export const Success: React.FC<SuccessProps> = ({
  corPrimaria,
  corSecundaria = '#D4AF37',
  nomeCliente,
  email,
  plano,
  valorPlano,
  contadorNome,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-8">
      {/* Ícone de Sucesso */}
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce"
          style={{ backgroundColor: `${corPrimaria}20` }}
        >
          <CheckCircle2 className="w-12 h-12" style={{ color: corPrimaria }} />
        </div>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: corPrimaria }}>
          Cadastro Concluído! 🎉
        </h1>
        <p className="text-gray-600">
          Bem-vindo ao Lovable-Celite, <strong>{nomeCliente}</strong>!
        </p>
      </div>

      {/* Confirmação */}
      <div 
        className="rounded-xl p-6 space-y-4"
        style={{
          background: `linear-gradient(135deg, rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.15) 0%, rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.1) 100%)`,
          border: `1px solid rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.4)`,
        }}
      >
        <h3 className="font-semibold" style={{ color: '#0C1A2A' }}>
          ✅ Cadastro realizado com sucesso!
        </h3>
        <p 
          className="text-xs rounded p-2"
          style={{ 
            color: '#0C1A2A', 
            backgroundColor: 'rgba(212, 175, 55, 0.25)',
            border: '1px solid rgba(212, 175, 55, 0.5)',
          }}
        >
          ⚠️ <strong>Modo Demonstração:</strong> O pagamento ainda não foi processado.
          Esta é uma versão de teste do onboarding.
        </p>
        
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-5 h-5 flex-shrink-0" style={{ color: '#0C1A2A' }} />
            <div>
              <p className="text-gray-700">
                Enviamos um email de confirmação para:
              </p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: '#0C1A2A' }} />
            <div>
              <p className="text-gray-700">
                Primeiro vencimento:
              </p>
              <p className="font-medium text-gray-900">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500">(30 dias de teste gratuito)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <CreditCard className="w-5 h-5 flex-shrink-0" style={{ color: '#0C1A2A' }} />
            <div>
              <p className="text-gray-700">
                Plano contratado:
              </p>
              <p className="font-medium text-gray-900">
                {plano} - R$ {valorPlano.toFixed(2)}/mês
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Próximos Passos */}
      <div 
        className="rounded-xl p-6 text-left space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(12, 26, 42, 0.1) 0%, rgba(26, 47, 71, 0.15) 100%)',
          border: '1px solid rgba(12, 26, 42, 0.15)',
        }}
      >
        <h3 className="font-semibold text-center" style={{ color: '#0C1A2A' }}>
          📋 Próximos Passos
        </h3>
        
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white text-xs"
              style={{ backgroundColor: corPrimaria }}
            >
              1
            </span>
            <p className="text-gray-700 pt-0.5">
              Verifique sua caixa de entrada e confirme seu email
            </p>
          </li>
          
          <li className="flex items-start gap-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white text-xs"
              style={{ backgroundColor: corPrimaria }}
            >
              2
            </span>
            <p className="text-gray-700 pt-0.5">
              <strong>{contadorNome}</strong> receberá uma notificação sobre seu cadastro
            </p>
          </li>
          
          <li className="flex items-start gap-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white text-xs"
              style={{ backgroundColor: corPrimaria }}
            >
              3
            </span>
            <p className="text-gray-700 pt-0.5">
              Seu contador entrará em contato em até 24h para iniciar o atendimento
            </p>
          </li>
        </ol>
      </div>

      {/* Informação Adicional */}
      <div className="text-sm text-gray-600">
        <p>
          Tem dúvidas? Entre em contato com{' '}
          <a
            href={`mailto:${email}`}
            className="underline font-medium"
            style={{ color: corPrimaria }}
          >
            seu contador
          </a>{' '}
          ou com nosso{' '}
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
            style={{ color: corPrimaria }}
          >
            suporte via WhatsApp
          </a>
        </p>
      </div>

      {/* Nota sobre Portal do Cliente */}
      <div 
        className="rounded-lg p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(12, 26, 42, 0.1) 0%, rgba(26, 47, 71, 0.1) 100%)',
          border: '1px solid rgba(12, 26, 42, 0.15)',
        }}
      >
        <p className="text-sm" style={{ color: '#0C1A2A' }}>
          <strong>💡 Em breve:</strong> Portal exclusivo para clientes com acesso às suas dependências,
          documentos e histórico de serviços completos.
        </p>
      </div>

      {/* Agradecimento */}
      <p className="text-sm text-gray-500 italic">
        Obrigado por escolher a Lovable-Celite! 🚀
      </p>
    </div>
  );
};

