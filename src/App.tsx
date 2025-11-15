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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Comissoes from "./pages/Comissoes";
import LinksIndicacao from "./pages/LinksIndicacao";
import Simulador from "./pages/Simulador";
import Educacao from "./pages/Educacao";
import Materiais from "./pages/Materiais";
import Assistente from "./pages/Assistente";
import AuthSecurityDashboard from "./pages/AuthSecurityDashboard";
import AuditoriaComissoes from "./pages/AuditoriaComissoes";
import AdminApprovalsPage from "./pages/AdminApprovalsPage";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import Saques from "./pages/Saques";
import Perfil from "./pages/Perfil";
import Rede from "./pages/Rede";
import Relatorios from "./pages/Relatorios";
import Pagamentos from "./pages/Pagamentos";
import CheckoutConfirmation from "./pages/CheckoutConfirmation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
