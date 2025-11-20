import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que scroll para o topo da página quando a rota muda
 * Útil para garantir que o usuário comece vendo o topo da página
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll para o topo
    window.scrollTo(0, 0);
  }, [pathname]);
}

