import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, BookOpen } from 'lucide-react';
import { GuideModal } from './GuideModal';
import type { SecurityCardConfig, SecurityStatus } from '@/types/auth-security';

interface SecurityCardProps {
  config: SecurityCardConfig;
  status: SecurityStatus;
  onStatusChange: (status: SecurityStatus) => void;
  dashboardUrl?: string;
}

export const SecurityCard = ({
  config,
  status,
  onStatusChange,
  dashboardUrl,
}: SecurityCardProps) => {
  const [showGuide, setShowGuide] = useState(false);
  const isConfigured = !!dashboardUrl;

  const statusConfig: Record<
    SecurityStatus,
    { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }
  > = {
    ok: { variant: 'default', label: 'OK' },
    pendente: { variant: 'secondary', label: 'Pendente' },
    'nao-verificado': { variant: 'outline', label: 'Não Verificado' },
  };

  const handleOpenSupabase = () => {
    if (isConfigured) {
      window.open(`${dashboardUrl}${config.supabasePath}`, '_blank');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <config.icon className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-lg">{config.title}</CardTitle>
                <CardDescription className="mt-1">{config.description}</CardDescription>
              </div>
            </div>
            <Badge variant={statusConfig[status].variant} className="flex-shrink-0">
              {statusConfig[status].label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Marcar como verificado</span>
            <Switch
              checked={status === 'ok'}
              onCheckedChange={(checked) => onStatusChange(checked ? 'ok' : 'nao-verificado')}
            />
          </div>

          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1">
                  <Button
                    onClick={handleOpenSupabase}
                    disabled={!isConfigured}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no Supabase
                  </Button>
                </div>
              </TooltipTrigger>
              {!isConfigured && (
                <TooltipContent>
                  Configure VITE_SUPABASE_DASHBOARD_URL nas variáveis de ambiente
                </TooltipContent>
              )}
            </Tooltip>

            <Button variant="outline" onClick={() => setShowGuide(true)} className="flex-1">
              <BookOpen className="w-4 h-4 mr-2" />
              Guia Rápida
            </Button>
          </div>
        </CardContent>
      </Card>

      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} content={config.guideContent} />
    </>
  );
};
