/**
 * Floating Action Button (FAB) - Mobile Quick Actions
 * Critical mobile-first UX for main actions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Plus,
  CreditCard,
  Users,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { share } from '@/lib/mobile-optimization';
import { toast } from 'sonner';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleShareLink = async () => {
    const referralLink = `https://contadores-elite.com/auth?ref=${Date.now()}`; // Replace with actual link

    const shared = await share({
      title: 'Junte-se aos Contadores de Elite',
      text: 'Ganhe comissões indicando contadores!',
      url: referralLink,
    });

    if (!shared) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(referralLink);
        toast.success('Link copiado!');
      } catch (e) {
        toast.error('Erro ao copiar link');
      }
    }

    setIsOpen(false);
  };

  const quickActions: QuickAction[] = [
    {
      icon: <Share2 className="h-5 w-5" />,
      label: 'Compartilhar Link',
      onClick: handleShareLink,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Assinar Pro',
      onClick: () => {
        navigate('/pagamentos');
        setIsOpen(false);
      },
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Ver Rede',
      onClick: () => {
        navigate('/rede');
        setIsOpen(false);
      },
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Actions */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 md:hidden">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm font-medium text-white bg-black/80 px-3 py-1 rounded-lg whitespace-nowrap">
                {action.label}
              </span>
              <Button
                size="icon"
                className={`h-12 w-12 rounded-full shadow-lg ${action.color || 'bg-primary'}`}
                onClick={action.onClick}
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon"
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 md:hidden transition-transform ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </>
  );
}
