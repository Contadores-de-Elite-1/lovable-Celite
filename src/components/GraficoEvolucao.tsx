// Componente lazy-loaded para grafico (so carrega quando necessario)
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/commission';

interface GraficoEvolucaoProps {
  contadorId: string;
}

interface DadosGrafico {
  mes: string;
  valor: number;
}

export default function GraficoEvolucao({ contadorId }: GraficoEvolucaoProps) {
  const [dados, setDados] = useState<DadosGrafico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      // Buscar apenas dados agregados (rapido)
      const ultimos6Meses: DadosGrafico[] = [];

      for (let i = 5; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        const mesStr = data.toISOString().slice(0, 7);
        const mesNome = data.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        });

        // Query otimizada: SUM no servidor
        const { data: resultado } = await supabase
          .from('comissoes')
          .select('valor')
          .eq('contador_id', contadorId)
          .like('competencia', `${mesStr}%`);

        const valorMes = resultado
          ? resultado.reduce((acc, c) => acc + c.valor, 0)
          : 0;

        ultimos6Meses.push({ mes: mesNome, valor: valorMes });
      }

      setDados(ultimos6Meses);
      setLoading(false);
    };

    fetchDados();
  }, [contadorId]);

  if (loading) {
    return (
      <div className="h-64 bg-gray-50 rounded animate-pulse flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando gráfico...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={dados}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="mes"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `R$${(value / 1000).toFixed(1)}k`}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="valor"
          stroke="#6366F1"
          strokeWidth={2}
          dot={{ fill: '#6366F1', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

