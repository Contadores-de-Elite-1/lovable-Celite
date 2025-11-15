import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ERROR_BOUNDARY]', error, errorInfo);

    // Log to error tracking service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: { react: errorInfo },
      });
    }

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-orange-50">
          <Card className="max-w-2xl w-full border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-900">
                <AlertCircle className="w-6 h-6" />
                Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Ocorreu um erro inesperado na aplicação. Você pode tentar recarregar a página ou voltar para a página inicial.
                </p>
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Detalhes do erro (modo desenvolvimento)
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-mono text-red-900">
                          {this.state.error.message}
                        </p>
                      </div>
                      {this.state.error.stack && (
                        <pre className="p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64 text-gray-800">
                          {this.state.error.stack}
                        </pre>
                      )}
                      {this.state.errorInfo && (
                        <pre className="p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64 text-gray-800">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Início
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  Se o problema persistir, entre em contato com o suporte:
                  <a
                    href="mailto:suporte@contadoresdeelite.com"
                    className="ml-1 text-blue-600 hover:underline"
                  >
                    suporte@contadoresdeelite.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper component for using hooks
export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default ErrorBoundary;
