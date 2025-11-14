import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig } from '@/components/ui/chart';

interface CommissionData {
  id: string;
  status_comissao: string;
  tipo_comissao: string;
  valor: number;
  created_at: string;
  competencia: string;
  contador?: {
    profiles?: {
      nome: string;
    };
  };
}

interface StatusTrendChartProps {
  data: CommissionData[];
  isLoading: boolean;
}

interface CommissionTypeChartProps {
  data: CommissionData[];
  isLoading: boolean;
}

interface TopContadoresChartProps {
  data: CommissionData[];
  isLoading: boolean;
}

// Chart Configuration
const statusChartConfig = {
  calculada: {
    label: 'Calculada',
    color: '#3b82f6', // blue
  },
  aprovada: {
    label: 'Aprovada',
    color: '#10b981', // green
  },
  paga: {
    label: 'Paga',
    color: '#8b5cf6', // purple
  },
  cancelada: {
    label: 'Cancelada',
    color: '#ef4444', // red
  },
} satisfies ChartConfig;

const typeChartConfig = {
  ativacao: {
    label: 'Ativação',
    color: '#3b82f6',
  },
  recorrente: {
    label: 'Recorrente',
    color: '#10b981',
  },
  override: {
    label: 'Override',
    color: '#f59e0b',
  },
  bonus_progressao: {
    label: 'Bônus Progressão',
    color: '#8b5cf6',
  },
  bonus_volume: {
    label: 'Bônus Volume',
    color: '#ec4899',
  },
  bonus_ltv: {
    label: 'Bônus LTV',
    color: '#06b6d4',
  },
  bonus_contador: {
    label: 'Bônus Contador',
    color: '#14b8a6',
  },
} satisfies ChartConfig;

/**
 * Status Trend Chart - Shows how commission statuses change over time
 * Displays pending, approved, paid, and cancelled commissions by week/month
 */
export const StatusTrendChart = ({ data, isLoading }: StatusTrendChartProps) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Group by week (simplified - by date)
    const grouped = new Map<
      string,
      { calculada: number; aprovada: number; paga: number; cancelada: number }
    >();

    data.forEach((commission) => {
      const date = new Date(commission.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().split('T')[0];

      if (!grouped.has(key)) {
        grouped.set(key, { calculada: 0, aprovada: 0, paga: 0, cancelada: 0 });
      }

      const entry = grouped.get(key)!;
      const status = commission.status_comissao as keyof typeof entry;
      if (status in entry) {
        entry[status]++;
      }
    });

    // Convert to array and sort by date
    return Array.from(grouped.entries())
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', {
          month: 'short',
          day: 'numeric',
        }),
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12); // Last 12 weeks
  }, [data]);

  if (isLoading) {
    return (
      <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-serif text-blue-900">
            Tendência de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-serif text-blue-900">
            Tendência de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-serif text-blue-900">Tendência de Status</CardTitle>
        <p className="text-xs text-gray-600 mt-1">Comissões por status ao longo do tempo</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={statusChartConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#666' }}
              />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="calculada"
                name="Calculada"
                stroke={statusChartConfig.calculada.color}
                dot={{ fill: statusChartConfig.calculada.color, r: 4 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="aprovada"
                name="Aprovada"
                stroke={statusChartConfig.aprovada.color}
                dot={{ fill: statusChartConfig.aprovada.color, r: 4 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="paga"
                name="Paga"
                stroke={statusChartConfig.paga.color}
                dot={{ fill: statusChartConfig.paga.color, r: 4 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="cancelada"
                name="Cancelada"
                stroke={statusChartConfig.cancelada.color}
                dot={{ fill: statusChartConfig.cancelada.color, r: 4 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

/**
 * Commission Type Distribution - Shows breakdown of commission types
 * Displays value distribution across ativacao, recorrente, override, bonuses
 */
export const CommissionTypeChart = ({ data, isLoading }: CommissionTypeChartProps) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Group by type and sum values
    const grouped = new Map<string, number>();

    data.forEach((commission) => {
      const type = commission.tipo_comissao || 'desconhecido';
      const current = grouped.get(type) || 0;
      grouped.set(type, current + Number(commission.valor));
    });

    // Convert to array and sort by value (descending)
    return Array.from(grouped.entries())
      .map(([name, value]) => ({
        name: name.replace('_', ' ').charAt(0).toUpperCase() + name.slice(1),
        value: Number(value.toFixed(2)),
        percentage: 0, // Will be calculated below
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = chartData.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
  }));

  if (isLoading) {
    return (
      <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base font-serif text-blue-900">Por Tipo de Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dataWithPercentage.length) {
    return (
      <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base font-serif text-blue-900">Por Tipo de Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#14b8a6',
  ];

  return (
    <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-1">
      <CardHeader>
        <CardTitle className="text-base font-serif text-blue-900">Por Tipo de Comissão</CardTitle>
        <p className="text-xs text-gray-600 mt-1">Distribuição de valores em R$</p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataWithPercentage}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#666"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#666' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend below chart */}
        <div className="space-y-2 text-xs">
          {dataWithPercentage.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-gray-700 font-medium flex-1">{item.name}</span>
              <span className="text-gray-600">
                R$ {item.value.toLocaleString('pt-BR')} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Top Contadores Chart - Shows which contadores have the most commission value
 * Helps identify top performers and bottlenecks
 */
export const TopContadoresChart = ({ data, isLoading }: TopContadoresChartProps) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Group by contador name and sum values
    const grouped = new Map<string, number>();

    data.forEach((commission) => {
      const name = commission.contador?.profiles?.nome || 'Desconhecido';
      const current = grouped.get(name) || 0;
      grouped.set(name, current + Number(commission.valor));
    });

    // Convert to array and sort by value (descending), take top 8
    return Array.from(grouped.entries())
      .map(([name, value]) => ({
        name: name.substring(0, 20), // Truncate long names
        valor: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [data]);

  if (isLoading) {
    return (
      <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base font-serif text-blue-900">Top Contadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base font-serif text-blue-900">Top Contadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-0 shadow-sm col-span-1 md:col-span-1">
      <CardHeader>
        <CardTitle className="text-base font-serif text-blue-900">Top Contadores</CardTitle>
        <p className="text-xs text-gray-600 mt-1">Por volume de comissões em R$</p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" style={{ fontSize: '12px' }} tick={{ fill: '#666' }} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#666"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#666' }}
                width={110}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="valor"
                fill="#3b82f6"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
