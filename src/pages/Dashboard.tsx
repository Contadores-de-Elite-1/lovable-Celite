import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  CalendarIcon,
  LogOutIcon,
  TrendingUpIcon,
  WalletIcon,
  LinkIcon,
  CalculatorIcon,
  UserIcon,
  AwardIcon,
  LineChartIcon,
  UsersIcon,
  CoinsIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const [comissoes, setComissoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('comissoes').select('*')
      if (!error) setComissoes(data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const total = comissoes.reduce((acc, curr) => acc + curr.valor, 0)
  const ultimas = comissoes.slice(0, 4)

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0C1A2A] p-4">
      {/* Header + Saldo */}
      <div className="bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A] rounded-2xl p-5 text-white mb-24 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-300">Bem-vindo,</p>
            <h1 className="text-lg font-semibold text-white">Contador</h1>
          </div>
          <div className="flex items-center gap-4">
            <CalendarIcon className="text-white" />
            <Button variant="ghost" size="sm" className="text-white flex items-center gap-1">
              <LogOutIcon size={16} /> Sair
            </Button>
          </div>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl mt-4">
          <p className="text-sm text-gray-200">Saldo Disponível</p>
          <h2 className="text-3xl font-bold text-white">R$ 12.450,00</h2>
          <div className="flex gap-3 mt-4">
            <Button className="bg-white text-[#0C1A2A]">Sacar</Button>
            <Button className="bg-[#D4AF37] text-[#0C1A2A] hover:bg-yellow-400">Indicar</Button>
          </div>
          
        </div>

        {/* Floating Cards */}
        <div className="absolute left-0 right-0 -bottom-60 px-5 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
            <CoinsIcon className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Comissões</p>
              <h3 className="text-xl font-semibold text-[#0C1A2A]">R$ 3.240</h3>
              <p className="text-xs text-green-600 mt-1">+12% este mês</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
            <UsersIcon className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Clientes Ativos</p>
              <h3 className="text-xl font-semibold text-[#0C1A2A]">148</h3>
              <p className="text-xs text-blue-600 mt-1">+8 novos</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
            <AwardIcon className="text-yellow-500" size={24} />
            <div>
              <p className="text-sm text-gray-500">Experiência</p>
              <h3 className="text-xl font-semibold text-[#0C1A2A]">R$ 3.240</h3>
              <p className="text-xs text-green-600 mt-1">+12% este mês</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md flex gap-3 items-start">
            <LineChartIcon className="text-red-400" size={24} />
            <div>
              <p className="text-sm text-gray-500">Crescimento</p>
              <h3 className="text-xl font-semibold text-[#0C1A2A]">148</h3>
              <p className="text-xs text-blue-600 mt-1">+8 novos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for floating cards */}
      <div className="mt-[270px]" />


      {/* Gráfico */}
      
      <div className="bg-white rounded-2xl p-4 shadow-md mb-6 ">
        <h4 className="font-semibold mb-3">Tendência de Comissões</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={comissoes.slice(0, 6)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data_pagamento" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip />
            <Bar dataKey="valor" fill="#6366F1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2">Ações Rápidas</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#6366F1] p-3 rounded-xl text-white flex flex-col items-center text-xs"><TrendingUpIcon size={18} />Comissões</div>
          <div className="bg-[#22C55E] p-3 rounded-xl text-white flex flex-col items-center text-xs"><WalletIcon size={18} />Saques</div>
          <div className="bg-[#1434A4] p-3 rounded-xl text-white flex flex-col items-center text-xs"><LinkIcon size={18} />Links</div>
          <div className="bg-[#D4AF37] p-3 rounded-xl text-white flex flex-col items-center text-xs"><CalculatorIcon size={18} />Simulador</div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="mb-24">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold">Atividades Recentes</h4>
          <a href="#" className="text-sm text-[#6366F1]">Ver todas</a>
        </div>
        <div className="bg-white rounded-xl shadow-md divide-y">
          <div className="p-4 flex justify-between">
            <div>
              <p className="text-sm">Comissão Recebida</p>
              <p className="text-xs text-gray-500">Hoje, 14:32</p>
            </div>
            <span className="text-green-600 font-medium">+R$150</span>
          </div>
          <div className="p-4 flex justify-between">
            <div>
              <p className="text-sm">Novo Indicado</p>
              <p className="text-xs text-gray-500">Hoje, 11:20</p>
            </div>
            <span className="text-gray-600">Maria S.</span>
          </div>
          <div className="p-4 flex justify-between">
            <div>
              <p className="text-sm">Saque Aprovado</p>
              <p className="text-xs text-gray-500">Ontem, 16:45</p>
            </div>
            <span className="text-[#0C1A2A]">R$500</span>
          </div>
          <div className="p-4 flex justify-between">
            <div>
              <p className="text-sm">Meta Atingida</p>
              <p className="text-xs text-gray-500">2 dias atrás</p>
            </div>
            <span className="text-orange-600 font-bold">100%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
