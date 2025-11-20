import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook Universal de Rastreamento de Referral
 * 
 * Captura o parâmetro ?ref=TOKEN de qualquer URL e salva:
 * - localStorage (persistente)
 * - cookie (30 dias)
 * 
 * Usado para rastrear indicações de:
 * - Clientes (comissão direta 15%)
 * - Contadores (override 5%)
 * 
 * Exemplo: https://site.com/qualquer-pagina?ref=ABC123
 */
export const useReferralTracking = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Buscar parâmetro ?ref= na URL
    const refToken = searchParams.get('ref');
    
    if (refToken && refToken.trim()) {
      // Salvar no localStorage
      localStorage.setItem('referral_token', refToken);
      localStorage.setItem('referral_date', new Date().toISOString());
      
      // Salvar em cookie (30 dias)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `referral_token=${refToken}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      
      console.log(`[Referral] Token capturado: ${refToken}`);
      
      // Registrar hit no analytics (opcional)
      trackReferralHit(refToken);
    }
  }, [searchParams]);
};

/**
 * Recupera o token de referral salvo
 */
export const getReferralToken = (): string | null => {
  // Tentar localStorage primeiro
  const localToken = localStorage.getItem('referral_token');
  if (localToken) return localToken;
  
  // Fallback para cookie
  const cookies = document.cookie.split(';');
  const referralCookie = cookies.find(c => c.trim().startsWith('referral_token='));
  if (referralCookie) {
    return referralCookie.split('=')[1];
  }
  
  return null;
};

/**
 * Limpa o token de referral após uso
 */
export const clearReferralToken = () => {
  localStorage.removeItem('referral_token');
  localStorage.removeItem('referral_date');
  document.cookie = 'referral_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log('[Referral] Token limpo');
};

/**
 * Registra hit de referral para analytics
 */
const trackReferralHit = async (token: string) => {
  try {
    // TODO: Implementar chamada para Edge Function de analytics
    // await supabase.functions.invoke('track-referral-hit', {
    //   body: { token, timestamp: new Date().toISOString() }
    // });
    console.log(`[Referral] Hit registrado para token: ${token}`);
  } catch (error) {
    console.error('[Referral] Erro ao registrar hit:', error);
  }
};

