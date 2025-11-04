import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/comissoes" element={
              <ProtectedRoute>
                <Comissoes />
              </ProtectedRoute>
            } />
            <Route path="/links" element={
              <ProtectedRoute>
                <LinksIndicacao />
              </ProtectedRoute>
            } />
            <Route path="/simulador" element={
              <ProtectedRoute>
                <Simulador />
              </ProtectedRoute>
            } />
            <Route path="/educacao" element={
              <ProtectedRoute>
                <Educacao />
              </ProtectedRoute>
            } />
            <Route path="/materiais" element={
              <ProtectedRoute>
                <Materiais />
              </ProtectedRoute>
            } />
            <Route path="/assistente" element={
              <ProtectedRoute>
                <Assistente />
              </ProtectedRoute>
            } />
            <Route path="/auth-security" element={
              <ProtectedRoute>
                <AuthSecurityDashboard />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
