import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOnboarding } from './hooks/useOnboarding';
import { OnboardingLayout } from './layout/OnboardingLayout';
import { Welcome } from './pages/Welcome';
import { PlanSelection } from './pages/PlanSelection';
import { DataUpload, DataUploadForm } from './pages/DataUpload';
import { ContractSignature } from './pages/ContractSignature';
import { PaymentStripe } from './pages/PaymentStripe';
import { Success } from './pages/Success';
import { fetchContadorByLink } from './mock/contadorMock';

interface ContadorData {
  id: string;
  nome: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
}

export const OnboardingApp: React.FC = () => {
  const { linkContador } = useParams<{ linkContador: string }>();
  const [contadorData, setContadorData] = useState<ContadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    etapaAtual,
    totalEtapas,
    atualizarDados,
    proximaEtapa,
    etapaAnterior,
    progresso,
  } = useOnboarding(linkContador || '');

  // Carregar dados do contador via link
  useEffect(() => {
    if (!linkContador) {
      setError('Link inválido');
      setLoading(false);
      return;
    }

    const fetchContadorData = async () => {
      try {
        // TODO: Substituir pelo fetch real da API
        // const response = await fetch(`/api/onboarding/contador/${linkContador}`);
        const dataContador = await fetchContadorByLink(linkContador);
        
        setContadorData(dataContador);
        atualizarDados({
          contadorId: dataContador.id,
          contadorNome: dataContador.nome,
          contadorLogo: dataContador.logo_url,
          contadorCorPrimaria: dataContador.cor_primaria,
          contadorCorSecundaria: dataContador.cor_secundaria,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar dados'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContadorData();
  }, [linkContador, atualizarDados]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4 animate-pulse">
            <div className="h-6 w-6 bg-blue-400 rounded-full" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !contadorData) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Algo deu errado
          </h1>
          <p className="text-gray-600 mb-4">
            {error || 'Não conseguimos carregar o onboarding'}
          </p>
          <p className="text-sm text-gray-500">
            Por favor, verifique o link compartilhado e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      progresso={progresso}
      etapaAtual={etapaAtual}
      totalEtapas={totalEtapas}
      contadorLogo={contadorData.logo_url}
      contadorCorPrimaria={contadorData.cor_primaria}
      contadorNome={contadorData.nome}
    >
      {/* Etapa 0: Welcome */}
      {etapaAtual === 0 && (
        <Welcome
          contadorNome={contadorData.nome}
          corPrimaria={contadorData.cor_primaria}
          corSecundaria={contadorData.cor_secundaria}
          onContinuar={proximaEtapa}
        />
      )}

      {/* Etapa 1: Plan Selection */}
      {etapaAtual === 1 && (
        <PlanSelection
          corPrimaria={contadorData.cor_primaria}
          corSecundaria={contadorData.cor_secundaria}
          onPlanoSelecionado={(plano) => {
            atualizarDados({ planoSelecionado: plano });
            proximaEtapa();
          }}
          onVoltar={etapaAnterior}
          planoAtual={data.planoSelecionado}
        />
      )}

      {/* Etapa 2: Data Upload */}
      {etapaAtual === 2 && (
        <DataUpload
          corPrimaria={contadorData.cor_primaria}
          corSecundaria={contadorData.cor_secundaria}
          onContinuar={(dados: DataUploadForm) => {
            atualizarDados({
              nomeEmpresa: dados.nomeEmpresa || dados.nome || '',
              cnpj: dados.cnpj || dados.cpf || '',
              email: dados.email,
              telefone: dados.telefone,
              endereco: {
                rua: dados.rua,
                numero: dados.numero,
                cidade: dados.cidade,
                estado: dados.estado,
                cep: dados.cep,
              },
              documentos: {
                contratoSocial: dados.contratoSocial || dados.cnh || null,
                certidao: dados.certidao || null,
                comprovanteMoradia: dados.comprovanteMoradia,
              },
            });
            proximaEtapa();
          }}
          onVoltar={etapaAnterior}
        />
      )}

      {/* Etapa 3: Contract Signature */}
      {etapaAtual === 3 && (
        <ContractSignature
          corPrimaria={contadorData.cor_primaria}
          corSecundaria={contadorData.cor_secundaria}
          nomeCliente={data.nomeEmpresa}
          plano={
            data.planoSelecionado === 'basico'
              ? 'Plano PRO'
              : data.planoSelecionado === 'profissional'
              ? 'Plano PREMIUM'
              : 'Plano TOP'
          }
          valorPlano={
            data.planoSelecionado === 'basico'
              ? 100
              : data.planoSelecionado === 'profissional'
              ? 130
              : 180
          }
          onContinuar={(assinatura: string) => {
            atualizarDados({ assinatura });
            proximaEtapa();
          }}
          onVoltar={etapaAnterior}
        />
      )}

      {/* Etapa 4: Payment Stripe */}
      {etapaAtual === 4 && (
        <PaymentStripe
          corPrimaria={contadorData.cor_primaria}
          corSecundaria={contadorData.cor_secundaria}
          plano={
            data.planoSelecionado === 'basico'
              ? 'Plano PRO'
              : data.planoSelecionado === 'profissional'
              ? 'Plano PREMIUM'
              : 'Plano TOP'
          }
          valorPlano={
            data.planoSelecionado === 'basico'
              ? 100
              : data.planoSelecionado === 'profissional'
              ? 130
              : 180
          }
          nomeCliente={data.nomeEmpresa}
          email={data.email}
          onContinuar={() => {
            atualizarDados({ statusPagamento: 'aprovado' });
            proximaEtapa();
          }}
          onVoltar={etapaAnterior}
        />
      )}

      {/* Etapa 5: Success */}
      {etapaAtual === 5 && (
        <Success
          corPrimaria={contadorData.cor_primaria}
          corSecundaria={contadorData.cor_secundaria}
          nomeCliente={data.nomeEmpresa}
          email={data.email}
          plano={
            data.planoSelecionado === 'basico'
              ? 'Plano PRO'
              : data.planoSelecionado === 'profissional'
              ? 'Plano PREMIUM'
              : 'Plano TOP'
          }
          valorPlano={
            data.planoSelecionado === 'basico'
              ? 100
              : data.planoSelecionado === 'profissional'
              ? 130
              : 180
          }
          contadorNome={contadorData.nome}
        />
      )}
    </OnboardingLayout>
  );
};

export default OnboardingApp;

