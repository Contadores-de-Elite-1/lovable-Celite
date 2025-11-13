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
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          {open && (
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Contadores de Elite
            </h2>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="ml-auto h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.principal.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className={getNavClass} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs">
            Recursos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.recursos.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className={getNavClass} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.configuracoes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className={getNavClass} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={user?.email || ""} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.nome || "Usuário"}
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
