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
  BarChart,
  Shield,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Comissões", url: "/comissoes", icon: DollarSign },
  { title: "Links de Indicação", url: "/links", icon: LinkIcon },
  { title: "Simulador", url: "/simulador", icon: Calculator },
  { title: "Rede", url: "/rede", icon: Users },
  { title: "Educação", url: "/educacao", icon: GraduationCap },
  { title: "Materiais", url: "/materiais", icon: FileText },
  { title: "Assistente Virtual", url: "/assistente", icon: Bot },
  { title: "Relatórios", url: "/relatorios", icon: BarChart },
  { title: "Segurança", url: "/auth-security", icon: Shield },
];

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "w-full h-12 flex items-center justify-center relative transition-all duration-200",
      "text-gray-400 hover:text-white hover:bg-blue-500/10",
      isActive && "text-blue-500 bg-blue-500/5 border-l-4 border-blue-500"
    );

  return (
    <Sidebar className="w-[70px] bg-[#1a1d29] border-r border-gray-800">
      <SidebarHeader className="h-14 flex items-center justify-center border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col items-center py-4">
        <SidebarMenu className="flex flex-col gap-1 w-full">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <NavLink to={item.url} className={getNavClass} onClick={handleLinkClick}>
                  <item.icon className="h-6 w-6" />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800 p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações">
              <NavLink to="/perfil" className={getNavClass}>
                <Settings className="h-6 w-6" />
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
