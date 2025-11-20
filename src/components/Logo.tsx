import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

/**
 * Componente de Logo - Contadores de Elite / Top Class
 * Reutilizável em diferentes contextos e tamanhos
 */
export function Logo({ size = 'md', showText = false, className }: LogoProps) {
  // Tenta carregar logo atualizada, com fallback para logo existente
  const logoPath = '/images/logo-topclass.png';
  const fallbackPath = '/images/espaco/Logo TopClass.png';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src={logoPath}
        alt="Contadores de Elite"
        className={cn(sizes[size], 'object-contain')}
        onError={(e) => {
          // Fallback automático se logo-topclass.png não existir
          const target = e.target as HTMLImageElement;
          if (!target.src.includes(fallbackPath)) {
            target.src = fallbackPath;
          }
        }}
      />
      {showText && (
        <span className={cn(textSizes[size], 'font-semibold text-[#D4AF37] whitespace-nowrap')}>
          Contadores de Elite
        </span>
      )}
    </div>
  );
}

/**
 * Logo para uso em Splash Screen / Loading
 */
export function LogoSplash() {
  return (
    <div className="fixed inset-0 bg-[#0C1A2A] flex items-center justify-center z-50">
      <div className="text-center">
        <img
          src="/images/logo-topclass.png"
          alt="Contadores de Elite"
          className="h-40 w-40 mx-auto animate-pulse object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/espaco/Logo TopClass.png';
          }}
        />
        <p className="text-[#D4AF37] text-xl font-semibold mt-8">
          Contadores de Elite
        </p>
      </div>
    </div>
  );
}

/**
 * Logo para uso em Header
 */
export function LogoHeader() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/images/logo-topclass.png"
        alt="Contadores de Elite"
        className="h-10 w-10 object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/images/espaco/Logo TopClass.png';
        }}
      />
      <span className="hidden sm:inline text-[#D4AF37] font-bold text-lg">
        Contadores de Elite
      </span>
    </div>
  );
}

/**
 * Logo para uso em Sidebar
 */
export function LogoSidebar() {
  return (
    <div className="flex flex-col items-center gap-2 pb-4 border-b border-[#D4AF37]/20">
      <img
        src="/images/logo-topclass.png"
        alt="Contadores de Elite"
        className="h-16 w-16 object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/images/espaco/Logo TopClass.png';
        }}
      />
      <span className="text-xs font-semibold text-[#D4AF37] text-center">
        Contadores de Elite
      </span>
    </div>
  );
}

/**
 * Logo Top Class para uso em onboarding e outras áreas
 */
export function LogoTopClass({ size = 'md', className }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return (
    <img
      src="/images/logo-topclass.png"
      alt="Top Class Escritório Virtual"
      className={cn(sizes[size || 'md'], 'object-contain', className)}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (!target.src.includes('espaco/Logo TopClass.png')) {
          target.src = '/images/espaco/Logo TopClass.png';
        }
      }}
    />
  );
}
