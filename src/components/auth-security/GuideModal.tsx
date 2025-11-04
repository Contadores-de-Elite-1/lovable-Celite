import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GuideContent } from '@/types/auth-security';

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
  content: GuideContent;
}

export const GuideModal = ({ open, onClose, content }: GuideModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>Siga os passos abaixo para configurar</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Numbered steps */}
          <div className="space-y-3">
            {content.steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          {/* SQL Snippets */}
          {content.sqlSnippets && content.sqlSnippets.length > 0 && (
            <div className="space-y-3">
              {content.sqlSnippets.map((snippet, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-medium">{snippet.label}</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Additional notes */}
          {content.notes && content.notes.length > 0 && (
            <div className="bg-secondary/10 border-l-4 border-secondary p-4 rounded">
              {content.notes.map((note, index) => (
                <p key={index} className="text-sm mb-2 last:mb-0">
                  💡 {note}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
