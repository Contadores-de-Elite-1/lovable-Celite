import { useReferralTracking } from '@/hooks/useReferralTracking';

/**
 * Componente que ativa o rastreamento universal de referral
 * Deve ser colocado dentro do Router para ter acesso aos searchParams
 */
export const ReferralTracker = () => {
  useReferralTracking();
  return null;
};

