import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "brk-design-system";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Phone,
  Target,
  Trophy,
  User,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading";
import {
  attendsEventsLabels,
  championshipParticipationLabels,
  competitiveLevelLabels,
  genderLabels,
  interestCategoryLabels,
  kartExperienceYearsLabels,
  raceFrequencyLabels,
} from "@/lib/enums/profile";
import {
  type PilotDetails,
  SeasonRegistrationService,
} from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";
import { formatDateToBrazilian } from "@/utils/date";
import { formatName } from "@/utils/name";

interface PilotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationId: string;
}

const PaymentStatusLabels = {
  pending: "Pendente",
  processing: "Processando",
  paid: "Pago",
  failed: "Falhou",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const RegistrationStatusLabels = {
  pending: "Pendente",
  payment_pending: "Aguardando Pagamento",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

export function PilotDetailsModal({
  isOpen,
  onClose,
  registrationId,
}: PilotDetailsModalProps) {
  const [pilotDetails, setPilotDetails] = useState<PilotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && registrationId) {
      loadPilotDetails();
    }
  }, [isOpen, registrationId]);

  const loadPilotDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const details =
        await SeasonRegistrationService.getPilotDetails(registrationId);
      setPilotDetails(details);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar detalhes do piloto");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "confirmed":
      case "exempt":
      case "direct_payment":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
      case "cancelled":
      case "expired":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "confirmed":
      case "exempt":
      case "direct_payment":
        return "bg-green-100 text-green-800";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
      case "cancelled":
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!pilotDetails && !loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Piloto
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loading type="spinner" size="md" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {pilotDetails && (
          <div className="space-y-4">
            {/* Aba Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nome Completo
                    </label>
                    <p className="text-sm">
                      {formatName(pilotDetails.user.name)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Apelido
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.nickName || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {pilotDetails.user.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Telefone
                    </label>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {pilotDetails.user.phone || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Data de Nascimento
                    </label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {pilotDetails.profile?.birthDate
                        ? formatDateToBrazilian(pilotDetails.profile.birthDate)
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Gênero
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.gender !== undefined
                        ? genderLabels[
                            pilotDetails.profile
                              .gender as keyof typeof genderLabels
                          ]
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Cidade
                    </label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {pilotDetails.profile?.city || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Estado
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.state || "Não informado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aba Experiência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Experiência e Preferências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Tempo de Experiência
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.experienceTime !== undefined
                        ? kartExperienceYearsLabels[
                            pilotDetails.profile
                              .experienceTime as keyof typeof kartExperienceYearsLabels
                          ]
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Frequência de Corridas
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.raceFrequency !== undefined
                        ? raceFrequencyLabels[
                            pilotDetails.profile
                              .raceFrequency as keyof typeof raceFrequencyLabels
                          ]
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Participação em Campeonatos
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.championshipParticipation !==
                      undefined
                        ? championshipParticipationLabels[
                            pilotDetails.profile
                              .championshipParticipation as keyof typeof championshipParticipationLabels
                          ]
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nível Competitivo
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.competitiveLevel !== undefined
                        ? competitiveLevelLabels[
                            pilotDetails.profile
                              .competitiveLevel as keyof typeof competitiveLevelLabels
                          ]
                        : "Não informado"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Possui Kart Próprio
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.hasOwnKart ? "Sim" : "Não"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Membro de Equipe
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.isTeamMember ? "Sim" : "Não"}
                    </p>
                  </div>
                  {pilotDetails.profile?.teamName && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nome da Equipe
                      </label>
                      <p className="text-sm">{pilotDetails.profile.teamName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Usa Telemetria
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.usesTelemetry ? "Sim" : "Não"}
                    </p>
                  </div>
                  {pilotDetails.profile?.telemetryType && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Tipo de Telemetria
                      </label>
                      <p className="text-sm">
                        {pilotDetails.profile.telemetryType}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Frequenta Eventos
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile?.attendsEvents !== undefined
                        ? attendsEventsLabels[
                            pilotDetails.profile
                              .attendsEvents as keyof typeof attendsEventsLabels
                          ]
                        : "Não informado"}
                    </p>
                  </div>
                </div>

                {pilotDetails.profile?.interestCategories &&
                  pilotDetails.profile.interestCategories.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Categorias de Interesse
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pilotDetails.profile.interestCategories.map(
                          (category: number, index: number) => (
                            <Badge key={index} variant="outline">
                              {
                                interestCategoryLabels[
                                  category as keyof typeof interestCategoryLabels
                                ]
                              }
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {pilotDetails.profile?.preferredTrack && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Pista Preferida
                    </label>
                    <p className="text-sm">
                      {pilotDetails.profile.preferredTrack}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aba Inscrição */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Dados da Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status da Inscrição
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(pilotDetails.registration.status)}
                      <Badge
                        className={getStatusColor(
                          pilotDetails.registration.status,
                        )}
                      >
                        {
                          RegistrationStatusLabels[
                            pilotDetails.registration
                              .status as keyof typeof RegistrationStatusLabels
                          ]
                        }
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status do Pagamento
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(pilotDetails.registration.paymentStatus)}
                      {pilotDetails.payments &&
                      pilotDetails.payments.length > 0 ? (
                        pilotDetails.payments.length > 1 ? (
                          // Pagamento parcelado
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            {
                              pilotDetails.payments.filter((p) =>
                                [
                                  "RECEIVED",
                                  "CONFIRMED",
                                  "RECEIVED_IN_CASH",
                                  "EXEMPT",
                                  "DIRECT_PAYMENT",
                                ].includes(p.status),
                              ).length
                            }
                            /{pilotDetails.payments.length} parcelas pagas
                          </Badge>
                        ) : (
                          // Pagamento único
                          <Badge
                            className={
                              pilotDetails.payments[0].status === "EXEMPT" ||
                              pilotDetails.payments[0].status ===
                                "DIRECT_PAYMENT"
                                ? "bg-green-100 text-green-800 border-green-200 text-xs"
                                : [
                                      "RECEIVED",
                                      "CONFIRMED",
                                      "RECEIVED_IN_CASH",
                                    ].includes(pilotDetails.payments[0].status)
                                  ? "text-xs bg-green-50 text-green-800 border-green-200"
                                  : [
                                        "PENDING",
                                        "AWAITING_PAYMENT",
                                        "AWAITING_RISK_ANALYSIS",
                                      ].includes(
                                        pilotDetails.payments[0].status,
                                      )
                                    ? "text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
                                    : "text-xs bg-gray-50 text-gray-800 border-gray-200"
                            }
                          >
                            {[
                              "RECEIVED",
                              "CONFIRMED",
                              "RECEIVED_IN_CASH",
                            ].includes(pilotDetails.payments[0].status)
                              ? "Pago"
                              : [
                                    "PENDING",
                                    "AWAITING_PAYMENT",
                                    "AWAITING_RISK_ANALYSIS",
                                  ].includes(pilotDetails.payments[0].status)
                                ? "Pendente"
                                : pilotDetails.payments[0].status === "EXEMPT"
                                  ? "Isento"
                                  : pilotDetails.payments[0].status ===
                                      "DIRECT_PAYMENT"
                                    ? "Pagamento Direto"
                                    : pilotDetails.payments[0].status}
                          </Badge>
                        )
                      ) : (
                        <Badge
                          className={
                            pilotDetails.registration.paymentStatus ===
                              "EXEMPT" ||
                            pilotDetails.registration.paymentStatus ===
                              "DIRECT_PAYMENT"
                              ? "bg-green-100 text-green-800 border-green-200 text-xs"
                              : PaymentStatusLabels[
                                  pilotDetails.registration
                                    .paymentStatus as keyof typeof PaymentStatusLabels
                                ]
                          }
                        >
                          {
                            PaymentStatusLabels[
                              pilotDetails.registration
                                .paymentStatus as keyof typeof PaymentStatusLabels
                            ]
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Valor da Inscrição
                    </label>
                    <p className="text-sm font-semibold">
                      {formatCurrency(pilotDetails.registration.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Data de Inscrição
                    </label>
                    <p className="text-sm">
                      {formatDateToBrazilian(
                        pilotDetails.registration.createdAt,
                      )}
                    </p>
                  </div>
                  {pilotDetails.registration.confirmedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Data de Confirmação
                      </label>
                      <p className="text-sm">
                        {formatDateToBrazilian(
                          pilotDetails.registration.confirmedAt,
                        )}
                      </p>
                    </div>
                  )}
                  {pilotDetails.registration.cancelledAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Data de Cancelamento
                      </label>
                      <p className="text-sm">
                        {formatDateToBrazilian(
                          pilotDetails.registration.cancelledAt,
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {pilotDetails.registration.categories &&
                  pilotDetails.registration.categories.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Categorias Inscritas
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pilotDetails.registration.categories.map((cat) => (
                          <Badge key={cat.id} variant="outline">
                            {cat.category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Etapas Pagas */}
                {pilotDetails.registration.stages &&
                  pilotDetails.registration.stages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Etapas Pagas
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pilotDetails.registration.stages.map((regStage) => (
                          <Badge
                            key={regStage.id}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {regStage.stage?.name || regStage.stageName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Detalhes de Pagamento */}
                {pilotDetails.payments && pilotDetails.payments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Detalhes de Pagamento
                    </label>
                    <div className="mt-2 space-y-2">
                      {pilotDetails.payments.length > 1 ? (
                        // Pagamento parcelado
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              {
                                pilotDetails.payments.filter((p) =>
                                  [
                                    "RECEIVED",
                                    "CONFIRMED",
                                    "RECEIVED_IN_CASH",
                                    "EXEMPT",
                                    "DIRECT_PAYMENT",
                                  ].includes(p.status),
                                ).length
                              }
                              /{pilotDetails.payments.length} parcelas pagas
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pilotDetails.payments.map((payment, index) => {
                              const isPaid = [
                                "RECEIVED",
                                "CONFIRMED",
                                "RECEIVED_IN_CASH",
                                "EXEMPT",
                                "DIRECT_PAYMENT",
                              ].includes(payment.status);
                              const isPending = [
                                "PENDING",
                                "AWAITING_PAYMENT",
                                "AWAITING_RISK_ANALYSIS",
                              ].includes(payment.status);
                              const isOverdue = payment.status === "OVERDUE";

                              return (
                                <div
                                  key={payment.id}
                                  className={`p-2 border rounded text-xs ${
                                    payment.status === "EXEMPT" ||
                                    payment.status === "DIRECT_PAYMENT" ||
                                    isPaid
                                      ? "bg-green-50 border-green-200"
                                      : isPending
                                        ? "bg-yellow-50 border-yellow-200"
                                        : isOverdue
                                          ? "bg-red-50 border-red-200"
                                          : "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                      Parcela{" "}
                                      {payment.installmentNumber || index + 1}
                                    </span>
                                    <Badge
                                      className={
                                        payment.status === "EXEMPT" ||
                                        payment.status === "DIRECT_PAYMENT"
                                          ? "bg-green-100 text-green-800 border-green-200 text-xs"
                                          : isPaid
                                            ? "text-xs bg-green-50 text-green-800 border-green-200"
                                            : isPending
                                              ? "text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
                                              : isOverdue
                                                ? "text-xs bg-red-50 text-red-800 border-red-200"
                                                : "text-xs bg-gray-50 text-gray-800 border-gray-200"
                                      }
                                    >
                                      {isPaid
                                        ? "Pago"
                                        : isPending
                                          ? "Pendente"
                                          : isOverdue
                                            ? "Vencido"
                                            : payment.status === "EXEMPT"
                                              ? "Isento"
                                              : payment.status ===
                                                  "DIRECT_PAYMENT"
                                                ? "Pagamento Direto"
                                                : payment.status}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground mt-1">
                                    <div>
                                      Valor: {formatCurrency(payment.value)}
                                    </div>
                                    <div>
                                      Vencimento:{" "}
                                      {formatDateToBrazilian(payment.dueDate)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        // Pagamento único
                        <div
                          className={`p-2 border rounded ${
                            pilotDetails.payments[0].status === "EXEMPT" ||
                            pilotDetails.payments[0].status ===
                              "DIRECT_PAYMENT" ||
                            [
                              "RECEIVED",
                              "CONFIRMED",
                              "RECEIVED_IN_CASH",
                            ].includes(pilotDetails.payments[0].status)
                              ? "bg-green-50 border-green-200"
                              : [
                                    "PENDING",
                                    "AWAITING_PAYMENT",
                                    "AWAITING_RISK_ANALYSIS",
                                  ].includes(pilotDetails.payments[0].status)
                                ? "bg-yellow-50 border-yellow-200"
                                : pilotDetails.payments[0].status === "OVERDUE"
                                  ? "bg-red-50 border-red-200"
                                  : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Pagamento Único</span>
                            <Badge
                              className={
                                pilotDetails.payments[0].status === "EXEMPT" ||
                                pilotDetails.payments[0].status ===
                                  "DIRECT_PAYMENT"
                                  ? "bg-green-100 text-green-800 border-green-200 text-xs"
                                  : [
                                        "RECEIVED",
                                        "CONFIRMED",
                                        "RECEIVED_IN_CASH",
                                      ].includes(
                                        pilotDetails.payments[0].status,
                                      )
                                    ? "text-xs bg-green-50 text-green-800 border-green-200"
                                    : [
                                          "PENDING",
                                          "AWAITING_PAYMENT",
                                          "AWAITING_RISK_ANALYSIS",
                                        ].includes(
                                          pilotDetails.payments[0].status,
                                        )
                                      ? "text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
                                      : "text-xs bg-gray-50 text-gray-800 border-gray-200"
                              }
                            >
                              {[
                                "RECEIVED",
                                "CONFIRMED",
                                "RECEIVED_IN_CASH",
                              ].includes(pilotDetails.payments[0].status)
                                ? "Pago"
                                : [
                                      "PENDING",
                                      "AWAITING_PAYMENT",
                                      "AWAITING_RISK_ANALYSIS",
                                    ].includes(pilotDetails.payments[0].status)
                                  ? "Pendente"
                                  : pilotDetails.payments[0].status === "EXEMPT"
                                    ? "Isento"
                                    : pilotDetails.payments[0].status ===
                                        "DIRECT_PAYMENT"
                                      ? "Pagamento Direto"
                                      : pilotDetails.payments[0].status}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground mt-1">
                            <div>
                              Valor:{" "}
                              {formatCurrency(pilotDetails.payments[0].value)}
                            </div>
                            <div>
                              Vencimento:{" "}
                              {formatDateToBrazilian(
                                pilotDetails.payments[0].dueDate,
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
