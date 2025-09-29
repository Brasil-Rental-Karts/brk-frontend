import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "brk-design-system";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { StageService } from "@/lib/services/stage.service";
import { SeasonService } from "@/lib/services/season.service";

const ConfirmParticipation = () => {
  const { stageId, categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const confirmFlow = async () => {
      if (!stageId || !categoryId) {
        setError("Algum erro ocorreu ao confirmar sua participação.");
        setLoading(false);
        return;
      }
      if (!user) {
        setError("Você precisa estar logado para confirmar sua participação.");
        setLoading(false);
        return;
      }

      try {
        // Buscar dados da etapa para identificar a temporada
        const stage = await StageService.getById(stageId);

        // Buscar inscrições do usuário
        const myRegistrations = await SeasonRegistrationService.getMyRegistrations();
        const registration = myRegistrations.find((r: any) => r.season?.id === stage.seasonId);

        if (!registration) {
          // Sem inscrição para a temporada → redirecionar para página de inscrição
          try {
            const season = await SeasonService.getById(stage.seasonId);
            if (season?.slug) {
              navigate(`/registration/${season.slug}?stageId=${stageId}&categoryId=${categoryId}`);
            } else {
              navigate(`/season/${stage.seasonId}/register?stageId=${stageId}&categoryId=${categoryId}`);
            }
          } catch {
            navigate(`/season/${stage.seasonId}/register?stageId=${stageId}&categoryId=${categoryId}`);
          }
          return;
        }

        // Para inscrições por_etapa, checar pagamento específico da etapa
        if (registration.inscriptionType === "por_etapa") {
          const findStageEntry = (regObj: any): any | null => {
            const candidates: any[] = [];
            if (Array.isArray(regObj?.stages)) candidates.push(...regObj.stages);
            if (Array.isArray(regObj?.seasonRegistrationStages)) candidates.push(...regObj.seasonRegistrationStages);
            if (Array.isArray(regObj?.seasonRegistrationStage)) candidates.push(...regObj.seasonRegistrationStage);
            if (Array.isArray(regObj?.stageRegistrations)) candidates.push(...regObj.stageRegistrations);
            const entry = candidates.find((s: any) => {
              const sId = typeof s === "string" ? s : s?.stageId || s?.id || s?.stage?.id;
              return sId === stageId;
            });
            return entry || null;
          };

          const stageEntry = findStageEntry(registration);

          // Se a inscrição é por_etapa e NÃO inclui esta etapa, redirecionar para se inscrever na etapa
          if (!stageEntry) {
            try {
              const season = await SeasonService.getById(stage.seasonId);
              if (season?.slug) {
                navigate(`/registration/${season.slug}/por_etapa?stageId=${stageId}&categoryId=${categoryId}`);
              } else {
                navigate(`/season/${stage.seasonId}/register?stageId=${stageId}&categoryId=${categoryId}`);
              }
            } catch {
              navigate(`/season/${stage.seasonId}/register?stageId=${stageId}&categoryId=${categoryId}`);
            }
            return;
          }

          let effectivePaymentStatus: string = registration.paymentStatus;
          const stageStatus: any = stageEntry?.paymentStatus || stageEntry?.status;
          const stagePaidBool: any = stageEntry?.paid || stageEntry?.isPaid;
          if (typeof stageStatus === "string") {
            effectivePaymentStatus = stageStatus;
          }
          if (stagePaidBool === true && !stageStatus) {
            effectivePaymentStatus = "paid";
          }

          const paidFlags = ["paid", "direct_payment", "exempt"];
          if (!paidFlags.includes(effectivePaymentStatus)) {
            // Redirecionar para a tela de pagamento da inscrição desta temporada
            navigate(`/registration/${registration.id}/payment?stageId=${stageId}&categoryId=${categoryId}`);
            return;
          }
        }

        // Se chegou aqui, pode confirmar (por_temporada ou por_etapa com etapa paga)
        await api.post(`/stage-participations/confirm`, {
          stageId,
          categoryId,
        });
        setSuccess(true);
      } catch (err: any) {
        const data = err?.response?.data;
        if (data?.message === "Sua participação já foi confirmada para esta etapa") {
          setSuccess(true);
          setError(null);
        } else {
          setError(data?.message || "Erro ao confirmar participação.");
        }
      } finally {
        setLoading(false);
      }
    };

    confirmFlow();
  }, [stageId, categoryId, user, navigate]);

  // Contador regressivo para redirecionar
  useEffect(() => {
    if (!loading && (success || error)) {
      if (countdown === 0) {
        navigate("/dashboard");
      } else {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [success, error, countdown, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="p-6 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Confirmação de Participação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loading
                type="spinner"
                size="md"
                message="Confirmando participação..."
              />
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
              <div className="text-xl font-semibold text-green-700 text-center">
                Participação confirmada com sucesso!
              </div>
              <div className="text-sm text-green-700 text-center">
                Você já está garantido no grid desta etapa. Nos vemos na pista!
                🏁
              </div>
              <div className="mt-4 text-gray-600 text-sm text-center">
                Redirecionando para{" "}
                <span className="font-semibold">Minha Página</span> em{" "}
                {countdown}s...
              </div>
            </div>
          ) : (
            <Alert
              variant="destructive"
              className="flex flex-col items-center text-center bg-red-50 border-red-200"
            >
              <AlertTitle className="text-lg font-semibold text-red-700 mb-2">
                {error ? error : "Não foi possível confirmar sua participação"}
              </AlertTitle>
              <AlertDescription className="mb-2 text-gray-700">
                {!error && (
                  <>
                    Ocorreu um problema ao tentar confirmar sua participação.
                    <br />
                    Por favor, tente novamente ou entre em contato com a organização.
                  </>
                )}
                {error && (
                  <>
                    Não foi possível confirmar sua participação.
                    <br />
                    Por favor, tente novamente ou entre em contato com a organização.
                  </>
                )}
              </AlertDescription>
              <div className="mt-2 text-gray-600 text-sm text-center">
                Redirecionando para{" "}
                <span className="font-semibold">Minha Página</span> em{" "}
                {countdown}s...
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmParticipation;
