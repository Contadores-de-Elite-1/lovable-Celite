import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Home,
  DollarSign,
  Link as LinkIcon,
  Calculator,
  Calculator as CalculatorIcon,
  Users,
  GraduationCap,
  FileText,
  Bot,
  User,
  BarChart,
  Shield,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CheckSquare,
  Wallet,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const menuItems = {
  principal: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Comissões", url: "/comissoes", icon: DollarSign },
    { title: "Saques", url: "/saques", icon: Wallet },
    { title: "Links de Indicação", url: "/links", icon: LinkIcon },
    { title: "Calculadora", url: "/calculadora", icon: Calculator },
    { title: "Simulador", url: "/simulador", icon: CalculatorIcon },
    { title: "Rede", url: "/rede", icon: Users },
  ],
  recursos: [
    { title: "Educação", url: "/educacao", icon: GraduationCap },
    { title: "Materiais", url: "/materiais", icon: FileText },
    { title: "Assistente Virtual", url: "/assistente", icon: Bot },
    {
      title: "Onboarding",
      icon: ClipboardCheck,
      submenu: [
        { title: "Onboarding Contadores", url: "/onboarding-contador" },
        { title: "Onboarding Clientes", url: "/onboarding/demo" },
      ],
    },
  ],
  configuracoes: [
    { title: "Perfil", url: "/perfil", icon: User },
    { title: "Relatórios", url: "/relatorios", icon: BarChart },
    { title: "Segurança", url: "/auth-security", icon: Shield },
    { title: "Auditoria Comissões", url: "/auditoria-comissoes", icon: ClipboardCheck },
    { title: "Aprovações", url: "/admin/approvals", icon: CheckSquare },
  ],
};

export function AppSidebar() {
  const { open, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Verificar se é admin
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      return data as boolean;
    },
    enabled: !!user,
  });

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-white/20 text-white font-medium"
      : "text-gray-100 hover:bg-slate-100/10 hover:text-white transition-colors";

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-800 bg-transparent"
    >
      {/* WRAPPER COM GRADIENTE E CORES */}
      <div className="flex h-full flex-col bg-gradient-to-b from-[#0C1A2A] to-[#111827] text-gray-200">
        {/* HEADER */}
        <SidebarHeader className="border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            {open && (
              <h2 className="text-lg font-semibold text-gray-100">
                Contadores de Elite
              </h2>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="ml-auto h-8 w-8 text-gray-300 hover:bg-white/10"
              >
                {open ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </SidebarHeader>

        {/* CONTEÚDO */}
        <SidebarContent className="px-1">
          {/* PRINCIPAL */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wide">
              PRINCIPAL
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.principal.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={getNavClass}
                        onClick={handleLinkClick}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* RECURSOS */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wide">
              RECURSOS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.recursos.map((item) => {
                  // Item com submenu
                  if ('submenu' in item && item.submenu) {
                    return (
                      <Collapsible
                        key={item.title}
                        open={onboardingOpen}
                        onOpenChange={setOnboardingOpen}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              className="text-gray-100 hover:bg-slate-100/10 hover:text-white transition-colors"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.submenu.map((subitem) => (
                                <SidebarMenuSubItem key={subitem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={subitem.url}
                                      className={getNavClass}
                                      onClick={handleLinkClick}
                                    >
                                      <span>{subitem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }
                  
                  // Item normal
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          className={getNavClass}
                          onClick={handleLinkClick}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* CONFIGURAÇÕES */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wide">
              CONFIGURAÇÕES
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.configuracoes
                  .filter((item) => {
                    // Onboarding apenas para admin
                    if (item.title === 'Onboarding') {
                      return isAdmin === true;
                    }
                    return true;
                  })
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          className={getNavClass}
                          onClick={handleLinkClick}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* LOGO – ABAIXO DE APROVAÇÕES */}
          <div className="mt-4 mb-6 flex w-full justify-center px-4">
            <img
              src="/images/logo-contadores-elite.jpeg"
              alt="Contadores de Elite"
              className="h-24 w-auto mx-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.3)] rounded-full border-2 border-[#D4AF37]/30 bg-white/10 p-2"
            />
          </div>



        </SidebarContent>

        {/* FOOTER / USUÁRIO */}
        <SidebarFooter className="border-t border-slate-800 p-4">
          <div className="flex flex-col gap-3">
            {/* Informacoes do usuario */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-slate-700 shadow-sm">
                <AvatarImage src="" alt={user?.email || ""} />
                <AvatarFallback className="bg-slate-900 text-gray-200 text-xs">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {open && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-gray-100 truncate">
                    {user?.user_metadata?.nome || "Usuário"}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </span>
                </div>
              )}
            </div>

            {/* Botao de Logout */}
            <Button
              variant="ghost"
              size={open ? "default" : "icon"}
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {open && <span>Sair</span>}
            </Button>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
