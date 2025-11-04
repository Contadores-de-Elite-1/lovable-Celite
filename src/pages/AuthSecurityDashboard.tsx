import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shield, Database, Users, AlertCircle, Check, Info, RotateCcw } from 'lucide-react';
import { SecurityCard } from '@/components/auth-security/SecurityCard';
import { AutomationGuideModal } from '@/components/auth-security/AutomationGuideModal';
import { useAuthSecurityStatus } from '@/hooks/useAuthSecurityStatus';
import type { SecurityCardConfig } from '@/types/auth-security';

const AuthSecurityDashboard = () => {
  const { status, updateStatus, resetStatus } = useAuthSecurityStatus();
  const [showAutomationGuide, setShowAutomationGuide] = useState(false);

  const dashboardUrl = import.meta.env.VITE_SUPABASE_DASHBOARD_URL;
  const projectRef =
    import.meta.env.VITE_SUPABASE_PROJECT_REF || 'zytxwdgzjqrcmbnpgofj';

  const securityCards: SecurityCardConfig[] = [
    {
      id: 'hibp',
      title: 'Proteção de senha vazada (HIBP)',
      description:
        'Rejeita senhas conhecidas em vazamentos (HaveIBeenPwned). Recomendado ativar.',
      icon: Shield,
      supabasePath: `/project/${projectRef}/auth/settings#password-security`,
      guideContent: {
        title: 'Ativar Proteção de Senhas Vazadas',
        steps: [
          'Acesse Settings → Authentication → Password security no Supabase Dashboard',
          'Ative a opção "Leaked password protection"',
          'Ajuste o comprimento mínimo da senha (recomendado: 8+ caracteres)',
          'Configure requisitos de complexidade conforme necessário',
          'Em "Bot & Abuse Protection", considere ativar CAPTCHA',
        ],
        notes: [
          'Esta proteção usa a API Have I Been Pwned para verificar senhas comprometidas',
          'A verificação acontece de forma segura sem expor a senha completa',
        ],
      },
    },
    {
      id: 'db_structure',
      title: 'Ver estrutura do banco de dados',
      description: 'Inspecione schemas, tabelas, colunas e políticas RLS.',
      icon: Database,
      supabasePath: `/project/${projectRef}/editor`,
      guideContent: {
        title: 'Inspecionar Estrutura do Banco',
        steps: [
          'Acesse o Table Editor no Supabase Dashboard',
          'Navegue pelas tabelas do schema público',
          'Verifique as colunas, tipos de dados e constraints',
          'Revise as políticas RLS de cada tabela',
          'Use o SQL Editor para queries avançadas',
        ],
        sqlSnippets: [
          {
            label: 'Listar todas as tabelas do schema público',
            code: `SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'public'\nORDER BY table_name;`,
          },
          {
            label: 'Ver colunas de uma tabela específica',
            code: `SELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_schema = 'public' AND table_name = 'sua_tabela'\nORDER BY ordinal_position;`,
          },
        ],
        notes: [
          'Mantenha RLS (Row Level Security) ativado em todas as tabelas sensíveis',
          'Revise regularmente as políticas para garantir acesso apropriado',
        ],
      },
    },
    {
      id: 'user_mgmt',
      title: 'Gerenciar usuários',
      description: 'Convide, ban, redefina senha, edite metadados e exporte.',
      icon: Users,
      supabasePath: `/project/${projectRef}/auth/users`,
      guideContent: {
        title: 'Gerenciamento de Usuários',
        steps: [
          'Acesse Auth → Users no Supabase Dashboard',
          'Visualize todos os usuários registrados',
          'Use os filtros para encontrar usuários específicos',
          'Gerencie metadados, resete senhas ou ban/unban conforme necessário',
          'Exporte dados quando precisar de relatórios',
        ],
        notes: [
          'NUNCA exponha a chave SERVICE_ROLE no frontend',
          'Para operações administrativas, use Edge Functions ou servidor backend',
          'Prefira magic links ou OTP para autenticação sem senha quando apropriado',
          'Mantenha logs de auditoria de todas as ações administrativas',
        ],
      },
    },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold font-serif text-primary">
              Segurança do Supabase Auth
            </h1>
            <p className="text-lg text-muted-foreground">
              Checklist de proteção, atalhos para o Supabase e notas de implementação
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {securityCards.map((card) => (
              <SecurityCard
                key={card.id}
                config={card}
                status={status[card.id]}
                onStatusChange={(newStatus) => updateStatus(card.id, newStatus)}
                dashboardUrl={dashboardUrl}
              />
            ))}
          </div>

          {/* Best Practices */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-secondary" />
                Boas Práticas & Automação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>
                    Ative <strong>CAPTCHA</strong> (Turnstile/reCAPTCHA) em Settings →
                    Authentication → Bot & Abuse Protection
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>
                    Mantenha <strong>Leaked Password Protection</strong> ativado
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>
                    Habilite <strong>revogação de tokens comprometidos</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>
                    Proteja <strong>anon sign-ins</strong> com CAPTCHA se habilitado
                  </span>
                </li>
              </ul>

              <div className="pt-4 border-t">
                <p className="text-sm text-foreground mb-3">
                  <strong>Automatização (Opcional):</strong> É possível automatizar toggles do
                  Auth usando a <strong>Supabase Management API</strong>, apenas via backend (Edge
                  Function/servidor) com <strong>Personal Access Token (PAT)</strong>. Por
                  segurança, não armazene PAT no app.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowAutomationGuide(true)}
                  className="w-full sm:w-auto"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Ver guia de automação
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center">
            <Button variant="destructive" onClick={resetStatus}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar Checklist
            </Button>
          </div>
        </div>
      </div>

      {/* Automation Modal */}
      <AutomationGuideModal
        open={showAutomationGuide}
        onClose={() => setShowAutomationGuide(false)}
      />
    </TooltipProvider>
  );
};

export default AuthSecurityDashboard;
