import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

interface AutomationGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export const AutomationGuideModal = ({ open, onClose }: AutomationGuideModalProps) => {
  const steps = [
    {
      num: 1,
      title: 'Criar Personal Access Token (PAT)',
      desc: 'Acesse sua conta do Supabase → Settings → Access Tokens e crie um novo token com permissões de gerenciamento de projeto.',
    },
    {
      num: 2,
      title: 'Implementar API segura',
      desc: 'Crie uma Edge Function ou endpoint backend que receba as intenções de configuração (ex: enable_leaked_password_protection: true).',
    },
    {
      num: 3,
      title: 'Chamar Management API',
      desc: 'Sua API backend deve chamar a Supabase Management API usando o PAT para atualizar as configurações do Auth.',
    },
    {
      num: 4,
      title: 'Implementar autenticação e auditoria',
      desc: 'Restrinja quem pode chamar sua API (auth + RBAC) e registre todas as operações em logs de auditoria.',
    },
    {
      num: 5,
      title: 'Frontend chama sua API',
      desc: 'O app Lovable apenas chama sua API segura (POST) e exibe o resultado. Nunca acessa diretamente a Management API.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guia de Automação via Management API</DialogTitle>
          <DialogDescription>
            Como automatizar configurações do Auth usando a API do Supabase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Importante: Segurança</AlertTitle>
            <AlertDescription>
              Esta automação deve ser implementada APENAS no backend (Edge Functions ou servidor próprio).
              Nunca exponha Personal Access Tokens ou SERVICE_ROLE no frontend.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Passos para Implementação</h3>

            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Exemplo de Contrato HTTP</h3>
            <p className="text-sm text-muted-foreground">
              Sua API backend deve expor um endpoint similar a este:
            </p>

            <div className="space-y-2">
              <div className="bg-muted p-3 rounded">
                <code className="text-sm">POST /api/auth-config</code>
              </div>

              <div>
                <p className="text-xs font-medium mb-2">Body JSON (exemplos):</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  <code>{`{
  "leaked_password_protection": true
}

{
  "captcha": {
    "enabled": true,
    "provider": "turnstile"
  }
}`}</code>
                </pre>
              </div>

              <div>
                <p className="text-xs font-medium mb-2">Respostas:</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  <code>{`// Sucesso (200)
{
  "ok": true,
  "applied": { ... }
}

// Erro (400/401/403)
{
  "ok": false,
  "error": "mensagem de erro"
}`}</code>
                </pre>
              </div>
            </div>
          </div>

          <Alert className="bg-secondary/10 border-secondary">
            <Info className="h-4 w-4" />
            <AlertTitle>Nota sobre esta Dashboard</AlertTitle>
            <AlertDescription>
              Nesta versão, a dashboard NÃO faz chamadas diretas à Management API. Ela apenas exibe
              o guia e os atalhos. Para implementar automação completa, siga os passos acima e crie
              seu próprio backend seguro.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
