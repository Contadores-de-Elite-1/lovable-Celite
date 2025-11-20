import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';

interface ContractSignatureProps {
  corPrimaria: string;
  corSecundaria?: string;
  nomeCliente: string;
  plano: string;
  valorPlano: number;
  onContinuar: (assinatura: string) => void;
  onVoltar: () => void;
}

export const ContractSignature: React.FC<ContractSignatureProps> = ({
  corPrimaria,
  corSecundaria = '#D4AF37',
  nomeCliente,
  plano,
  valorPlano,
  onContinuar,
  onVoltar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas para mobile
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Estilo da linha
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleContinuar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Converter canvas para base64
    const assinaturaBase64 = canvas.toDataURL('image/png');
    onContinuar(assinaturaBase64);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
      {/* Título */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileText className="w-6 h-6" style={{ color: corPrimaria }} />
          <h2 className="text-2xl font-bold" style={{ color: corPrimaria }}>
            Contrato de Serviço
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Leia atentamente e assine para prosseguir
        </p>
      </div>

      {/* Resumo do Contrato */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Resumo do Contrato</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium">{nomeCliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Plano Contratado:</span>
            <span className="font-medium">{plano}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valor Mensal:</span>
            <span className="font-medium">R$ {valorPlano.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600">Início da Vigência:</span>
            <span className="font-medium">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Prévia do Contrato (scroll) */}
      <div className="border rounded-xl p-4 h-48 overflow-y-auto bg-white text-xs text-gray-700 space-y-2">
        <h4 className="font-semibold text-sm text-gray-900">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h4>
        
        <p>
          <strong>CONTRATANTE:</strong> {nomeCliente}
        </p>
        
        <p>
          <strong>CONTRATADA:</strong> Lovable-Celite Ltda, CNPJ 00.000.000/0000-00
        </p>
        
        <p>
          <strong>OBJETO:</strong> A CONTRATADA prestará ao CONTRATANTE serviços de contabilidade
          conforme o plano "{plano}" no valor mensal de R$ {valorPlano.toFixed(2)}.
        </p>
        
        <p>
          <strong>CLÁUSULA 1 - DO PRAZO:</strong> O presente contrato terá vigência de 12 (doze) meses,
          renovável automaticamente por igual período, salvo manifestação contrária de qualquer das
          partes com antecedência mínima de 30 (trinta) dias.
        </p>
        
        <p>
          <strong>CLÁUSULA 2 - DO PAGAMENTO:</strong> O pagamento será realizado mensalmente via
          Stripe Checkout, com vencimento no dia {new Date().getDate()} de cada mês.
        </p>
        
        <p>
          <strong>CLÁUSULA 3 - DAS OBRIGAÇÕES DA CONTRATADA:</strong> A CONTRATADA se obriga a
          prestar os serviços de acordo com as especificações do plano contratado, incluindo
          suporte técnico e acesso ao portal de gestão.
        </p>
        
        <p>
          <strong>CLÁUSULA 4 - DAS OBRIGAÇÕES DO CONTRATANTE:</strong> O CONTRATANTE se obriga a
          fornecer todas as informações e documentos necessários para a prestação dos serviços,
          bem como efetuar o pagamento nas datas acordadas.
        </p>
        
        <p>
          <strong>CLÁUSULA 5 - DA RESCISÃO:</strong> O contrato poderá ser rescindido por qualquer
          das partes mediante aviso prévio de 30 (trinta) dias, sem ônus adicional.
        </p>
        
        <p>
          <strong>CLÁUSULA 6 - DO FORO:</strong> Fica eleito o foro da comarca de [CIDADE], para
          dirimir quaisquer dúvidas oriundas do presente contrato.
        </p>
        
        <p className="pt-4">
          E, por estarem assim justos e contratados, firmam o presente instrumento em via digital.
        </p>
      </div>

      {/* Checkbox de Aceite */}
      <div 
        className="flex items-start gap-3 p-4 rounded-lg"
        style={{
          background: `linear-gradient(135deg, rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.15) 0%, rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.1) 100%)`,
          border: `1px solid rgba(${parseInt(corSecundaria.slice(1,3), 16)}, ${parseInt(corSecundaria.slice(3,5), 16)}, ${parseInt(corSecundaria.slice(5,7), 16)}, 0.4)`,
        }}
      >
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
        />
        <label
          htmlFor="terms"
          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
        >
          Li e concordo com todos os termos do contrato acima. Estou ciente de que minha
          assinatura digital tem validade jurídica.
        </label>
      </div>

      {/* Área de Assinatura */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Assinatura Digital *</Label>
          {hasSignature && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSignature}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          Desenhe sua assinatura no espaço abaixo usando o mouse ou dedo (touch)
        </p>

        <div
          className="border-2 border-dashed rounded-xl overflow-hidden cursor-crosshair"
          style={{
            borderColor: hasSignature ? corPrimaria : '#d1d5db',
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-40 bg-white touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {!hasSignature && (
          <p className="text-xs text-center text-gray-400 italic">
            Aguardando assinatura...
          </p>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onVoltar}
          className="flex-1 py-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handleContinuar}
          className="flex-1 py-6 font-medium"
          style={{ backgroundColor: corPrimaria }}
        >
          Assinar e Continuar
        </Button>
      </div>
    </div>
  );
};

// Label component simples
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => <label className={className}>{children}</label>;

