import { Button } from "brk-design-system";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PreRegistrationBannerProps {
  generalRegistrationDate: Date;
  seasonName?: string;
  onBack?: () => void;
}

export const PreRegistrationBanner: React.FC<PreRegistrationBannerProps> = ({
  generalRegistrationDate,
  seasonName,
  onBack,
}) => {
  const navigate = useNavigate();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div
          role="alert"
          aria-live="polite"
          className="w-full bg-gradient-to-br from-primary/10 to-primary/5 border-t-2 border-b-2 border-primary/30 rounded-lg shadow-lg p-6 md:p-8"
        >
          {/* Header com ícone e título */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Pré-Inscrição em Andamento
            </h2>
          </div>

          {/* Mensagem principal */}
          <div className="space-y-4 mb-6">
            <p className="text-base md:text-lg text-foreground">
              As inscrições gerais abrem em{" "}
              <time
                dateTime={generalRegistrationDate.toISOString()}
                className="font-semibold text-primary"
              >
                {formatDate(generalRegistrationDate)}
              </time>
            </p>

            <p className="text-sm md:text-base text-muted-foreground">
              No momento, apenas pilotos que participaram da temporada anterior
              podem se inscrever.
            </p>
          </div>

          {/* Botão Voltar */}
          <div className="flex justify-center">
            <Button
              onClick={handleBack}
              variant="outline"
              className="min-w-[120px]"
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

