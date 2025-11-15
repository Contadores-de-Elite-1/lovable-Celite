/**
 * Onboarding System - Interactive Tour for New Users
 * Mobile-first, step-by-step guide
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  action?: string; // Button text
  nextStep?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingState {
  isActive: boolean;
  currentStep: string | null;
  completedSteps: string[];
  isCompleted: boolean;
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

// Onboarding flow for new users
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo aos Contadores de Elite! 🎉',
    description: 'Vamos te mostrar como funciona em 3 passos rápidos.',
    action: 'Começar',
    nextStep: 'dashboard',
  },
  {
    id: 'dashboard',
    title: 'Seu Dashboard',
    description: 'Aqui você vê suas comissões, rede e ganhos totais em tempo real.',
    target: '.dashboard-stats',
    action: 'Próximo',
    nextStep: 'share-link',
    position: 'bottom',
  },
  {
    id: 'share-link',
    title: 'Compartilhe seu Link',
    description: 'Compartilhe seu link de indicação e ganhe comissões de toda sua rede!',
    target: '[href="/links"]',
    action: 'Próximo',
    nextStep: 'first-payment',
    position: 'bottom',
  },
  {
    id: 'first-payment',
    title: 'Receba Pagamentos',
    description: 'Configure seus dados e receba suas comissões todo dia 25.',
    target: '[href="/perfil"]',
    action: 'Entendi!',
    nextStep: 'complete',
    position: 'bottom',
  },
];

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: null,
      completedSteps: [],
      isCompleted: false,

      startOnboarding: () => {
        set({
          isActive: true,
          currentStep: ONBOARDING_STEPS[0].id,
          completedSteps: [],
          isCompleted: false,
        });
      },

      nextStep: () => {
        const { currentStep, completedSteps } = get();
        if (!currentStep) return;

        const currentStepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
        const currentStepData = ONBOARDING_STEPS[currentStepIndex];

        // Mark current as completed
        const newCompleted = [...completedSteps, currentStep];

        // Get next step
        const nextStepId = currentStepData.nextStep;

        if (nextStepId === 'complete' || currentStepIndex === ONBOARDING_STEPS.length - 1) {
          get().completeOnboarding();
          return;
        }

        set({
          currentStep: nextStepId,
          completedSteps: newCompleted,
        });
      },

      skipOnboarding: () => {
        set({
          isActive: false,
          currentStep: null,
          isCompleted: true,
        });
      },

      completeOnboarding: () => {
        set({
          isActive: false,
          currentStep: null,
          isCompleted: true,
          completedSteps: ONBOARDING_STEPS.map((s) => s.id),
        });
      },

      resetOnboarding: () => {
        set({
          isActive: false,
          currentStep: null,
          completedSteps: [],
          isCompleted: false,
        });
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);

/**
 * Check if user should see onboarding
 */
export function shouldShowOnboarding(user: any): boolean {
  const { isCompleted } = useOnboarding.getState();

  // Skip if already completed
  if (isCompleted) return false;

  // Show for new users (created in last 7 days)
  if (user?.created_at) {
    const createdDate = new Date(user.created_at);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < 7;
  }

  return true;
}

/**
 * Auto-start onboarding for new users
 */
export function autoStartOnboarding(user: any) {
  if (shouldShowOnboarding(user)) {
    // Delay to let page load
    setTimeout(() => {
      useOnboarding.getState().startOnboarding();
    }, 1000);
  }
}

export default useOnboarding;
