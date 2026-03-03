import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  LogOut,
  ChevronDown,
  Building2,
  Handshake,
  CreditCard,
  LayoutDashboard,
  UserCheck,
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
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Tipagem ────────────────────────────────────────────────────────────────────

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

// ── Menus por role ─────────────────────────────────────────────────────────────

const MENU_CONTADOR: MenuSection[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Comissões", url: "/comissoes", icon: DollarSign },
      { title: "Saques", url: "/saques", icon: Wallet },
      { title: "Indicações", url: "/indicacoes", icon: Handshake },
      { title: "Links de Indicação", url: "/links", icon: LinkIcon },
      { title: "Rede", url: "/rede", icon: Users },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { title: "Calculadora", url: "/calculadora", icon: Calculator },
      { title: "Simulador", url: "/simulador", icon: Calculator },
    ],
  },
  {
    label: "Recursos",
    items: [
      { title: "Educação", url: "/educacao", icon: GraduationCap },
      { title: "Materiais", url: "/materiais", icon: FileText },
      { title: "Assistente Virtual", url: "/assistente", icon: Bot },
    ],
  },
  {
    label: "Configurações",
    items: [
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Relatórios", url: "/relatorios", icon: BarChart },
    ],
  },
];

const MENU_MPE: MenuSection[] = [
  {
    label: "Minha Empresa",
    items: [
      { title: "Visão Geral", url: "/mpe/membros", icon: LayoutDashboard },
      { title: "Pagamento", url: "/mpe/pagamento", icon: CreditCard },
    ],
  },
  {
    label: "Configurações",
    items: [{ title: "Perfil", url: "/perfil", icon: User }],
  },
];

const MENU_COWORKING: MenuSection[] = [
  {
    label: "Coworking",
    items: [
      { title: "Indicações Recebidas", url: "/coworking/indicacoes", icon: Handshake },
      { title: "Membros", url: "/coworking/membros", icon: UserCheck },
    ],
  },
  {
    label: "Configurações",
    items: [{ title: "Perfil", url: "/perfil", icon: User }],
  },
];

const MENU_ADMIN_EXTRA: MenuItem[] = [
  { title: "Segurança", url: "/auth-security", icon: Shield },
  { title: "Auditoria Comissões", url: "/auditoria-comissoes", icon: ClipboardCheck },
  { title: "Aprovações", url: "/admin/approvals", icon: CheckSquare },
  { title: "Saques Admin", url: "/admin/withdrawals", icon: Wallet },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  contador: "Contador",
  suporte: "Suporte",
  mpe: "Empresa",
  coworking: "Coworking",
};

const ROLE_BADGE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-500/20 text-red-300 border-red-500/30",
  contador: "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30",
  suporte: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  mpe: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  coworking: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

function getMenuSections(role: AppRole | null): MenuSection[] {
  switch (role) {
    case "mpe":
      return MENU_MPE;
    case "coworking":
      return MENU_COWORKING;
    default:
      // contador, admin, suporte e null usam o menu principal do contador
      return MENU_CONTADOR;
  }
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const { open, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const menuSections = getMenuSections(role);
  const isAdmin = role === "admin";

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-white/20 text-white font-medium"
      : "text-gray-100 hover:bg-slate-100/10 hover:text-white transition-colors";

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-800 bg-transparent">
      <div className="flex h-full flex-col bg-gradient-to-b from-[#0C1A2A] to-[#111827] text-gray-200">

        {/* HEADER */}
        <SidebarHeader className="border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            {open && (
              <h2 className="text-lg font-semibold text-gray-100">Contadores de Elite</h2>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="ml-auto h-8 w-8 text-gray-300 hover:bg-white/10"
              >
                {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </SidebarHeader>

        {/* CONTEÚDO — menus dinâmicos por role */}
        <SidebarContent className="px-1">

          {menuSections.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wide">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
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
          ))}

          {/* Onboarding — visível apenas para contador/admin */}
          {(role === "contador" || isAdmin) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wide">
                Onboarding
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible
                    open={onboardingOpen}
                    onOpenChange={setOnboardingOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip="Onboarding"
                          className="text-gray-100 hover:bg-slate-100/10 hover:text-white transition-colors"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          <span>Onboarding</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to="/onboarding-contador"
                                className={getNavClass}
                                onClick={handleLinkClick}
                              >
                                <span>Onboarding Contadores</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to="/onboarding/demo"
                                className={getNavClass}
                                onClick={handleLinkClick}
                              >
                                <span>Onboarding Clientes</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Admin exclusivo */}
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-400 uppercase text-xs tracking-wide">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {MENU_ADMIN_EXTRA.map((item) => (
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
          )}

          {/* Logo */}
          <div className="mt-4 mb-6 flex w-full justify-center px-4">
            <img
              src="/images/logo-contadores-elite.webp"
              alt="Contadores de Elite"
              className="h-24 w-auto mx-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.3)] rounded-full border-2 border-[#D4AF37]/30 bg-white/10 p-2"
              decoding="async"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("logo-topclass.png")) {
                  target.src = "/images/logo-topclass.png";
                }
              }}
            />
          </div>
        </SidebarContent>

        {/* FOOTER — usuário + badge de role */}
        <SidebarFooter className="border-t border-slate-800 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-slate-700 shadow-sm">
                <AvatarImage src="" alt={user?.email || ""} />
                <AvatarFallback className="bg-slate-900 text-gray-200 text-xs">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {open && (
                <div className="flex flex-col overflow-hidden gap-1">
                  <span className="text-sm font-medium text-gray-100 truncate">
                    {user?.user_metadata?.nome || "Usuário"}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{user?.email}</span>
                  {role && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 w-fit border ${ROLE_BADGE_COLORS[role]}`}
                    >
                      {ROLE_LABELS[role]}
                    </Badge>
                  )}
                </div>
              )}
            </div>

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
