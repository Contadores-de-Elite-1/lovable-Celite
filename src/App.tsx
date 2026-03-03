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

// Páginas públicas (críticas para primeira impressão)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Páginas gerais (autenticadas)
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

// V5.0 — Marketplace e perfis tripartite
const Indicacoes = lazy(() => import("./pages/Indicacoes"));
const AcessoNegado = lazy(() => import("./pages/AcessoNegado"));
const MpeMembros = lazy(() => import("./pages/mpe/MembrosPage"));
const MpePagamento = lazy(() => import("./pages/mpe/PagamentoPage"));
const CoworkingIndicacoes = lazy(() => import("./pages/coworking/IndicacoesPage"));
const CoworkingMembros = lazy(() => import("./pages/coworking/MembrosPage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-elite-navy">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-elite-gold mx-auto mb-4" />
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
              {/* Rotas públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding/:linkContador" element={<OnboardingApp />} />
              <Route path="/onboarding-contador" element={<ContadorOnboarding />} />
              <Route path="/acesso-negado" element={<AcessoNegado />} />

              {/* Rotas protegidas — layout com sidebar */}
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
                              {/* ── Contador / Admin / Suporte ─────────────────── */}
                              <Route
                                path="/dashboard"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin', 'suporte']}>
                                    <Dashboard />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/comissoes"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin', 'suporte']}>
                                    <Comissoes />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/saques"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin']}>
                                    <Saques />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/indicacoes"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin']}>
                                    <Indicacoes />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/links"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin']}>
                                    <LinksIndicacao />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/calculadora"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin']}>
                                    <Calculadora />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/simulador"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin']}>
                                    <Simulador />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/rede"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin']}>
                                    <Rede />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/educacao"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin', 'suporte']}>
                                    <Educacao />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/materiais"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin', 'suporte']}>
                                    <Materiais />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/assistente"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin']}>
                                    <Assistente />
                                  </ProtectedRoute>
                                }
                              />
                              <Route path="/perfil" element={<Perfil />} />
                              <Route
                                path="/relatorios"
                                element={
                                  <ProtectedRoute allowedRoles={['contador', 'admin', 'suporte']}>
                                    <Relatorios />
                                  </ProtectedRoute>
                                }
                              />

                              {/* ── Admin exclusivo ────────────────────────────── */}
                              <Route
                                path="/auth-security"
                                element={
                                  <ProtectedRoute allowedRoles={['admin']}>
                                    <AuthSecurityDashboard />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/auditoria-comissoes"
                                element={
                                  <ProtectedRoute allowedRoles={['admin', 'suporte']}>
                                    <AuditoriaComissoes />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/admin/approvals"
                                element={
                                  <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminApprovalsPage />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/admin/withdrawals"
                                element={
                                  <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminWithdrawals />
                                  </ProtectedRoute>
                                }
                              />

                              {/* ── MPE ───────────────────────────────────────── */}
                              <Route
                                path="/mpe/membros"
                                element={
                                  <ProtectedRoute allowedRoles={['mpe', 'admin']}>
                                    <MpeMembros />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/mpe/pagamento"
                                element={
                                  <ProtectedRoute allowedRoles={['mpe', 'admin']}>
                                    <MpePagamento />
                                  </ProtectedRoute>
                                }
                              />

                              {/* ── Coworking ──────────────────────────────────── */}
                              <Route
                                path="/coworking/indicacoes"
                                element={
                                  <ProtectedRoute allowedRoles={['coworking', 'admin']}>
                                    <CoworkingIndicacoes />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/coworking/membros"
                                element={
                                  <ProtectedRoute allowedRoles={['coworking', 'admin']}>
                                    <CoworkingMembros />
                                  </ProtectedRoute>
                                }
                              />

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
