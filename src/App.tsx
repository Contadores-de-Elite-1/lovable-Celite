import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load non-critical pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Comissoes = lazy(() => import("./pages/Comissoes"));
const LinksIndicacao = lazy(() => import("./pages/LinksIndicacao"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Educacao = lazy(() => import("./pages/Educacao"));
const Materiais = lazy(() => import("./pages/Materiais"));
const Assistente = lazy(() => import("./pages/Assistente"));
const AuthSecurityDashboard = lazy(() => import("./pages/AuthSecurityDashboard"));
const AuditoriaComissoes = lazy(() => import("./pages/AuditoriaComissoes"));
const AdminApprovalsPage = lazy(() => import("./pages/AdminApprovalsPage"));
const AdminWithdrawals = lazy(() => import("./pages/AdminWithdrawals"));
const Saques = lazy(() => import("./pages/Saques"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Rede = lazy(() => import("./pages/Rede"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const CheckoutConfirmation = lazy(() => import("./pages/CheckoutConfirmation"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col w-full">
                        <MobileHeader />
                        <main className="flex-1 pt-14 md:pt-0">
                          <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/comissoes" element={<Comissoes />} />
                          <Route path="/saques" element={<Saques />} />
                          <Route path="/pagamentos" element={<Pagamentos />} />
                          <Route path="/checkout-confirmation" element={<CheckoutConfirmation />} />
                          <Route path="/links" element={<LinksIndicacao />} />
                          <Route path="/simulador" element={<Simulador />} />
                          <Route path="/rede" element={<Rede />} />
                          <Route path="/educacao" element={<Educacao />} />
                          <Route path="/materiais" element={<Materiais />} />
                          <Route path="/assistente" element={<Assistente />} />
                          <Route path="/perfil" element={<Perfil />} />
                          <Route path="/relatorios" element={<Relatorios />} />
                          <Route path="/auth-security" element={<AuthSecurityDashboard />} />
                          <Route path="/auditoria-comissoes" element={<AuditoriaComissoes />} />
                          <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
                          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
          </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
