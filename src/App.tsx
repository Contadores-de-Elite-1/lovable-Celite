import { lazy, Suspense } from "react";
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

// Páginas públicas carregadas normalmente (críticas para primeira impressão)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load de todas as outras páginas
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Comissoes = lazy(() => import("./pages/Comissoes"));
const LinksIndicacao = lazy(() => import("./pages/LinksIndicacao"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Calculadora = lazy(() => import("./pages/Calculadora"));
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
const NotFound = lazy(() => import("./pages/NotFound"));
const OnboardingApp = lazy(() => import("./onboarding"));
const ContadorOnboarding = lazy(() => import("./pages/ContadorOnboarding"));

const queryClient = new QueryClient();

// Componente de loading para Suspense
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-elite-navy">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-elite-gold mx-auto mb-4"></div>
      <p className="text-elite-gold font-medium">Carregando...</p>
    </div>
  </div>
);

const App = () => (
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
              <Route path="/onboarding/:linkContador" element={<OnboardingApp />} />
              <Route path="/onboarding-contador" element={<ContadorOnboarding />} />
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
                          <Route path="/links" element={<LinksIndicacao />} />
                          <Route path="/calculadora" element={<Calculadora />} />
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
);

export default App;
