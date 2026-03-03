import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Se definido, apenas usuários com um destes roles podem acessar a rota.
   *  Se omitido, qualquer usuário autenticado tem acesso (backward-compatible). */
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, role, roleLoading } = useAuth();

  // Aguarda sessão e role carregarem
  if (loading || (user && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não autenticado → redireciona para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Role insuficiente → redireciona para página de acesso negado
  if (allowedRoles && allowedRoles.length > 0 && role !== null && !allowedRoles.includes(role)) {
    return <Navigate to="/acesso-negado" replace />;
  }

  return <>{children}</>;
};
