import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export function MobileHeader() {
  const { toggleSidebar, isMobile } = useSidebar();
  const { user } = useAuth();
  
  if (!isMobile) return null;
  
  return (
    <header className="
      fixed top-0 left-0 right-0 z-50 h-14
      bg-gradient-to-r from-[#0C1A2A] to-[#1C2F4A]
      backdrop-blur border-b border-slate-800
      md:hidden
    ">
      <div className="flex items-center justify-between h-full px-4">
        
        {/* Botão do menu */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="text-gray-200 hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Título */}
        <h1 className="text-sm font-semibold text-gray-200">
          Contadores de Elite
        </h1>
        
        {/* Avatar */}
        <Avatar className="h-8 w-8 border border-slate-700 shadow-sm">
          <AvatarImage src="" alt={user?.email || ""} />
          <AvatarFallback className="bg-slate-900 text-gray-200 text-xs">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      
      </div>
    </header>
  );
}
