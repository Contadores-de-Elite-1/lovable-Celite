import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Foto {
  id: string;
  src: string;
  alt: string;
  descricao?: string;
}

interface CarrosselFotosProps {
  fotos: Foto[];
  className?: string;
}

/**
 * Componente de carrossel para fotos do espaço
 * Design mobile-first com indicação clara de movimento
 */
export function CarrosselFotos({ fotos, className = '' }: CarrosselFotosProps) {
  const [fotoAtual, setFotoAtual] = useState(0);
  const [imagensCarregadas, setImagensCarregadas] = useState<Set<string>>(new Set());

  if (!fotos || fotos.length === 0) return null;

  const handleImageError = (id?: string) => {
    if (!id) return;
    // Remover imagem que falhou ao carregar
    setImagensCarregadas(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleImageLoad = (id?: string) => {
    if (!id) return;
    setImagensCarregadas(prev => new Set(prev).add(id));
  };

  // Filtrar apenas imagens válidas - REJEITAR logomarcas
  const fotosValidas = fotos.filter(foto => {
    if (!foto || !foto.src) return false;
    
    const srcLower = foto.src.toLowerCase();
    const idLower = foto.id?.toLowerCase() || '';
    
    // REJEITAR qualquer imagem com "logo" no caminho
    if (srcLower.includes('logo')) return false;
    if (idLower.includes('logo')) return false;
    
    // REJEITAR qualquer imagem com "topclass" ou "tc" (exceto se for parte de "pagina")
    if ((srcLower.includes('topclass') || srcLower.includes('top-class')) && !srcLower.includes('pagina')) return false;
    if ((idLower.includes('topclass') || idLower.includes('top-class')) && !idLower.includes('pagina')) return false;
    
    // REJEITAR imagens do PDF que sabemos que são logos (pagina-1-img-1, pagina-1-img-2, pagina-2-img-1)
    if (srcLower.includes('pagina-1-img-1') || srcLower.includes('pagina-1-img-2') || srcLower.includes('pagina-2-img-1')) return false;
    if (idLower.includes('pdf-p1-img-1') || idLower.includes('pdf-p1-img-2') || idLower.includes('pdf-p2-img-1')) return false;
    
    return true;
  });
  
  if (fotosValidas.length === 0) return null;

  const fotoAnterior = () => {
    setFotoAtual((atual) => (atual === 0 ? fotosValidas.length - 1 : atual - 1));
  };

  const proximaFoto = () => {
    setFotoAtual((atual) => (atual === fotosValidas.length - 1 ? 0 : atual + 1));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Carrossel principal */}
      <div className="relative overflow-hidden rounded-xl shadow-lg bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={fotoAtual}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="relative aspect-[16/10] md:aspect-[21/9] flex items-center justify-center bg-gray-50 overflow-hidden"
          >
            <img
              src={fotosValidas[fotoAtual]?.src}
              alt={fotosValidas[fotoAtual]?.alt || 'Imagem'}
              className="w-full h-full object-cover"
              style={{ transform: 'scale(1.05)' }}
              loading="lazy"
              onError={() => handleImageError(fotosValidas[fotoAtual]?.id)}
              onLoad={() => handleImageLoad(fotosValidas[fotoAtual]?.id)}
            />
            
            {/* Descrição overlay */}
            {fotosValidas[fotoAtual]?.descricao && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 md:p-6">
                <p className="text-white text-sm md:text-base font-medium">
                  {fotosValidas[fotoAtual].descricao}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Botão Anterior - Sempre visível */}
        <Button
          variant="ghost"
          size="icon"
          onClick={fotoAnterior}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white backdrop-blur-sm text-[#0C1A2A] rounded-full shadow-xl border-2 border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all z-10"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Button>

        {/* Botão Próximo - Sempre visível */}
        <Button
          variant="ghost"
          size="icon"
          onClick={proximaFoto}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white backdrop-blur-sm text-[#0C1A2A] rounded-full shadow-xl border-2 border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all z-10"
          aria-label="Próxima foto"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </Button>

        {/* Indicador de posição - Badge flutuante */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#0C1A2A] px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-lg border border-[#D4AF37]/30">
          {fotoAtual + 1} / {fotosValidas.length}
        </div>

        {/* Indicadores de swipe - Mobile */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
          {fotosValidas.map((_, index) => (
            <button
              key={index}
              onClick={() => setFotoAtual(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === fotoAtual
                  ? 'w-8 bg-[#D4AF37]'
                  : 'w-1.5 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Ir para foto ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Miniaturas - Desktop */}
      {fotosValidas.length > 1 && (
        <div className="hidden md:flex gap-2.5 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {fotosValidas.map((foto, index) => (
            <motion.button
              key={foto.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFotoAtual(index)}
              className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all relative ${
                index === fotoAtual
                  ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-lg'
                  : 'border-gray-300 hover:border-[#D4AF37]/50 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={foto.src}
                alt={foto.alt}
                className="w-full h-full object-cover"
                style={{ transform: 'scale(1.15)' }}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Texto de ajuda - Mobile */}
      {fotosValidas.length > 1 && (
        <p className="text-center text-xs text-gray-500 mt-2 md:hidden">
          Deslize ou use as setas para navegar
        </p>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
