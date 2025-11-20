import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
}

export const QRCodeGenerator = ({ url, size = 256 }: QRCodeGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#0C1A2A',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Erro ao gerar QR Code:', error);
        }
      );
    }
  }, [url, size]);

  const downloadQRCode = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'qr-code-indicacao.png';
    link.href = dataUrl;
    link.click();
    toast.success('QR Code baixado com sucesso!');
  };

  if (!url) {
    return (
      <div className="text-center text-gray-500 py-8">
        <QrCode className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Gere seu link primeiro para ver o QR Code</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <canvas ref={canvasRef} />
      </div>
      <Button
        onClick={downloadQRCode}
        variant="outline"
        className="w-full"
      >
        <Download className="w-4 h-4 mr-2" />
        Baixar QR Code
      </Button>
      <p className="text-xs text-gray-600 text-center max-w-xs">
        Imprima e distribua este QR Code em materiais de marketing. Qualquer pessoa que escanear será automaticamente vinculada a você!
      </p>
    </div>
  );
};

