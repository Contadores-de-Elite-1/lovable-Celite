import { NavLink } from "react-router-dom";
import {
  Home,
  DollarSign,
  Link as LinkIcon,
  Calculator,
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
    { title: "Simulador", url: "/simulador", icon: Calculator },
    { title: "Rede", url: "/rede", icon: Users },
  ],
  recursos: [
    { title: "Educação", url: "/educacao", icon: GraduationCap },
    { title: "Materiais", url: "/materiais", icon: FileText },
    { title: "Assistente Virtual", url: "/assistente", icon: Bot },
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
  const { user } = useAuth();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-white/20 text-white font-medium"
      : "text-gray-100 hover:bg-slate-100/10 hover:text-white transition-colors";

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
                {menuItems.recursos.map((item) => (
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

          {/* CONFIGURAÇÕES */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wide">
              CONFIGURAÇÕES
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.configuracoes.map((item) => (
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
<div className="mt-4 mb-6 flex w-full justify-center">
  <img
    src="/ce-logo.png"
    alt="Contadores de Elite"
    className="h-32 w-auto mx-auto object-contain drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]"
  />
</div>



        </SidebarContent>

        {/* FOOTER / USUÁRIO */}
        <SidebarFooter className="border-t border-slate-800 p-4">
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
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
