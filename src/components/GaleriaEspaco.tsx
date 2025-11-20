import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Foto {
  id: string;
  src: string;
  alt: string;
  descricao?: string;
}

interface GaleriaEspacoProps {
  fotos: Foto[];
  titulo?: string;
}

/**
 * Componente para exibir galeria de fotos do espaço Top Class
 * Design mobile-first, instagramável e sofisticado
 */
export function GaleriaEspaco({ fotos, titulo = 'Conheça nosso espaço' }: GaleriaEspacoProps) {
  const [aberto, setAberto] = useState(false);
  const [fotoAtual, setFotoAtual] = useState(0);

  const fotoAnterior = () => {
    setFotoAtual((atual) => (atual === 0 ? fotos.length - 1 : atual - 1));
  };

  const proximaFoto = () => {
    setFotoAtual((atual) => (atual === fotos.length - 1 ? 0 : atual + 1));
  };

  if (fotos.length === 0) {
    return null;
  }

  const fotoDestaque = fotos[0];
  const outrasFotos = fotos.slice(1);

  return (
    <>
      {/* Preview da galeria - Design Instagramável */}
      <div className="space-y-4">
        {/* Título com ícone */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center shadow-lg">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{titulo}</h3>
        </div>

        {/* Layout Mobile-First: Foto destaque grande + Grid 2 colunas */}
        <div className="space-y-3">
          {/* Foto Destaque (Grande) - Primeira foto */}
          <motion.button
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setFotoAtual(0);
              setAberto(true);
            }}
            className="relative w-full rounded-2xl overflow-hidden shadow-xl group"
          >
            {/* Imagem com aspect ratio 16:9 */}
            <div className="relative aspect-[16/10] bg-gray-100">
              <img
                src={fotoDestaque.src}
                alt={fotoDestaque.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Overlay gradiente sutil no hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Badge "Destaque" */}
              <div className="absolute top-3 left-3 bg-[#D4AF37] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                <span>⭐</span>
                <span>Destaque</span>
              </div>

              {/* Ícone de zoom no hover */}
              <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                <ZoomIn className="w-5 h-5 text-gray-900" />
              </div>

              {/* Descrição no hover (mobile: só se tiver espaço) */}
              {fotoDestaque.descricao && (
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">
                    {fotoDestaque.descricao}
                  </p>
                </div>
              )}
            </div>
          </motion.button>

          {/* Grid 2 colunas para outras fotos (Mobile) */}
          {outrasFotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {outrasFotos.map((foto, index) => {
                const fotoIndex = index + 1; // +1 porque a primeira já está destacada
                const isUltima = fotoIndex === fotos.length - 1 && fotos.length > 3;
                
                return (
                  <motion.button
                    key={foto.id}
                    whileHover={{ scale: 0.97 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFotoAtual(fotoIndex);
                      setAberto(true);
                    }}
                    className="relative rounded-xl overflow-hidden shadow-lg group"
                  >
                    {/* Aspect ratio quadrado para grid */}
                    <div className="relative aspect-square bg-gray-100">
                      <img
                        src={foto.src}
                        alt={foto.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Overlay gradiente sutil */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Ícone de zoom */}
                      <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                        <ZoomIn className="w-4 h-4 text-gray-900" />
                      </div>

                      {/* Badge "+X mais" se for a última */}
                      {isUltima && fotos.length > 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            +{fotos.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Se tiver só 1 foto, não mostra grid */}
          {fotos.length === 1 && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">Clique na foto para ampliar</p>
            </div>
          )}
        </div>

        {/* Botão CTA - Ver todas */}
        {fotos.length > 1 && (
          <Button
            variant="outline"
            onClick={() => setAberto(true)}
            className="w-full py-6 rounded-xl font-semibold border-2 hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl"
          >
            <Camera className="w-4 h-4 mr-2" />
            Ver todas as fotos ({fotos.length})
          </Button>
        )}
      </div>

      {/* Modal com galeria completa - Design Sofisticado */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-6xl w-full p-0 bg-black/95 backdrop-blur-lg border-none">
          <DialogHeader className="absolute top-4 left-4 z-20 bg-white/10 backdrop-blur-md rounded-lg px-4 py-2">
            <DialogTitle className="text-white text-sm font-medium">{titulo}</DialogTitle>
          </DialogHeader>

          <div className="relative">
            {/* Foto atual com animação */}
            <div className="relative aspect-video bg-gray-900">
              <AnimatePresence mode="wait">
                <motion.img
                  key={fotoAtual}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  src={fotos[fotoAtual].src}
                  alt={fotos[fotoAtual].alt}
                  className="w-full h-full object-contain"
                />
              </AnimatePresence>

              {/* Botão anterior - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full border border-white/30 shadow-xl"
                onClick={fotoAnterior}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              {/* Botão próximo - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full border border-white/30 shadow-xl"
                onClick={proximaFoto}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Botão fechar */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full border border-white/30 shadow-lg"
                onClick={() => setAberto(false)}
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Swipe nas laterais - Mobile */}
              <div 
                className="md:hidden absolute left-0 top-0 bottom-0 w-1/3" 
                onClick={fotoAnterior}
              />
              <div 
                className="md:hidden absolute right-0 top-0 bottom-0 w-1/3" 
                onClick={proximaFoto}
              />
            </div>

            {/* Descrição */}
            <AnimatePresence mode="wait">
              {fotos[fotoAtual].descricao && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-6 bg-gradient-to-b from-black/90 to-black/95 backdrop-blur-md"
                >
                  <p className="text-white text-sm leading-relaxed">{fotos[fotoAtual].descricao}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Miniaturas - Horizontal Scroll */}
            <div className="p-4 bg-black/95 backdrop-blur-md border-t border-white/10 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-2">
                {fotos.map((foto, index) => (
                  <motion.button
                    key={foto.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFotoAtual(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shadow-lg ${
                      index === fotoAtual
                        ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-[#D4AF37]/50'
                        : 'border-white/20 hover:border-white/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={foto.src}
                      alt={foto.alt}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Contador - Badge flutuante */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold border border-white/30 shadow-xl"
            >
              {fotoAtual + 1} / {fotos.length}
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Estilos customizados para scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
