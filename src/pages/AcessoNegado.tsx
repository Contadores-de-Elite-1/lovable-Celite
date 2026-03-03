import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, AppRole } from '@/hooks/useAuth';

const ROLE_HOME: Record<AppRole, string> = {
  admin: '/dashboard',
  contador: '/dashboard',
  suporte: '/dashboard',
  mpe: '/mpe/membros',
  coworking: '/coworking/indicacoes',
};

const AcessoNegado = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const home = role ? ROLE_HOME[role] : '/auth';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C1A2A] via-[#1a2f47] to-[#0C1A2A] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
          <ShieldOff className="w-12 h-12 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Acesso Negado</h1>
          <p className="text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o suporte se acredita que isso é um erro.
          </p>
        </div>

        <Button
          onClick={() => navigate(home)}
          className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#0C1A2A] font-semibold gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default AcessoNegado;
