import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Input,
  Label,
} from "brk-design-system";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonLoader } from "@/components/ui/loading";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const CONFIRMATION_TEXT = "Eu quero excluir minha conta";

export const DeleteAccountModal = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) => {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmationTextCorrect = confirmationInput === CONFIRMATION_TEXT;

  const handleConfirm = async () => {
    if (!isConfirmationTextCorrect) return;

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao tentar excluir a conta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmationInput("");
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Conta</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Sua conta e todos os dados
            associados serão permanentemente removidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm">
            Para confirmar, digite o seguinte texto no campo abaixo:
          </p>
          <p className="text-sm font-semibold select-none text-destructive">
            {CONFIRMATION_TEXT}
          </p>
          <div>
            <Label htmlFor="confirmation-input" className="sr-only">
              Texto de confirmação
            </Label>
            <Input
              id="confirmation-input"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="Digite o texto de confirmação aqui"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationTextCorrect || isLoading}
          >
            {isLoading && <ButtonLoader size="sm" />}
            Excluir permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
