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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur border-b md:hidden">
      <div className="flex items-center justify-between h-full px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <h1 className="text-sm font-semibold text-foreground">Contadores de Elite</h1>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={user?.email || ""} />
          <AvatarFallback className="bg-muted text-foreground">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
