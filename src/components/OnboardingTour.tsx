/**
 * Onboarding Tour Component
 * Interactive step-by-step guide for new users
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS } from '@/lib/onboarding';

export function OnboardingTour() {
  const { isActive, currentStep, nextStep, skipOnboarding } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentStepData = ONBOARDING_STEPS.find((s) => s.id === currentStep);

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    // Find target element
    if (currentStepData.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      setTargetElement(element);

      if (element) {
        // Highlight element
        element.classList.add('onboarding-highlight');

        // Calculate position
        const rect = element.getBoundingClientRect();
        const tooltipPos = getTooltipPosition(
          rect,
          currentStepData.position || 'bottom'
        );
        setPosition(tooltipPos);

        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        return () => {
          element.classList.remove('onboarding-highlight');
        };
      }
    } else {
      // Center modal for steps without target
      setTargetElement(null);
    }
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" />

      {/* Tooltip */}
      <Card
        className={`fixed z-50 p-6 max-w-sm mx-4 shadow-2xl ${
          targetElement
            ? ''
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
        style={
          targetElement
            ? {
                top: `${position.top}px`,
                left: `${position.left}px`,
              }
            : undefined
        }
      >
        {/* Close button */}
        <button
          onClick={skipOnboarding}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">{currentStepData.title}</h3>
          <p className="text-sm text-gray-600">{currentStepData.description}</p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={skipOnboarding} className="flex-1">
              Pular Tour
            </Button>
            <Button onClick={nextStep} className="flex-1">
              {currentStepData.action || 'Próximo'}
            </Button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 justify-center">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full ${
                  step.id === currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

/**
 * Calculate tooltip position relative to target element
 */
function getTooltipPosition(
  targetRect: DOMRect,
  position: 'top' | 'bottom' | 'left' | 'right'
): { top: number; left: number } {
  const offset = 16; // spacing from target

  switch (position) {
    case 'bottom':
      return {
        top: targetRect.bottom + offset,
        left: targetRect.left + targetRect.width / 2 - 200, // 200 = half of max-w-sm
      };
    case 'top':
      return {
        top: targetRect.top - offset - 200, // approximate height
        left: targetRect.left + targetRect.width / 2 - 200,
      };
    case 'left':
      return {
        top: targetRect.top + targetRect.height / 2 - 100,
        left: targetRect.left - offset - 400,
      };
    case 'right':
      return {
        top: targetRect.top + targetRect.height / 2 - 100,
        left: targetRect.right + offset,
      };
    default:
      return {
        top: targetRect.bottom + offset,
        left: targetRect.left + targetRect.width / 2 - 200,
      };
  }
}
