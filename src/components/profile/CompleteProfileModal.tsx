import { Button } from "brk-design-system";
import { ArrowRight, CheckCircle, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

export const CompleteProfileModal = ({
  isOpen,
  onClose,
  onSkip,
}: CompleteProfileModalProps) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCompleteProfile = () => {
    setIsNavigating(true);
    navigate("/profile/edit");
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Se o modal está sendo fechado (ESC, clique fora, etc.), tratar como "Agora não"
      onSkip();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">
            Complete seu perfil
          </DialogTitle>
          <DialogDescription className="text-base">
            Para aproveitar ao máximo a plataforma BRK, complete suas
            informações de piloto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Benefícios de completar o perfil:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Acesso a funcionalidades exclusivas</li>
              <li>• Recomendações personalizadas</li>
              <li>• Melhor experiência na plataforma</li>
              <li>• Comunicação mais eficiente</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="w-full sm:w-auto"
          >
            Agora não
          </Button>
          <Button
            onClick={handleCompleteProfile}
            disabled={isNavigating}
            className="w-full sm:w-auto"
          >
            {isNavigating ? (
              "Redirecionando..."
            ) : (
              <>
                Completar perfil
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
