import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "brk-design-system";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  MapPin,
  RotateCcw,
  Trash2,
  UserX,
  XCircle,
} from "lucide-react";
import React from "react";

import {
  Penalty,
  PenaltyService,
  PenaltyStatus,
  PenaltyType,
} from "@/lib/services/penalty.service";
import { formatName } from "@/utils/name";

interface PenaltyListProps {
  penalties: Penalty[];
  loading?: boolean;
  onApplyPenalty?: (id: string) => void;
  onCancelPenalty?: (id: string) => void;
  onAppealPenalty?: (id: string) => void;
  onEditPenalty?: (penalty: Penalty) => void;
  onDeletePenalty?: (id: string) => void;
  showActions?: boolean;
}

export const PenaltyList: React.FC<PenaltyListProps> = ({
  penalties,
  loading = false,
  onApplyPenalty,
  onCancelPenalty,
  onAppealPenalty,
  onEditPenalty,
  onDeletePenalty,
  showActions = true,
}) => {
  const getPenaltyIcon = (type: PenaltyType) => {
    switch (type) {
      case PenaltyType.DISQUALIFICATION:
        return <UserX className="h-4 w-4" />;
      case PenaltyType.TIME_PENALTY:
        return <Clock className="h-4 w-4" />;
      case PenaltyType.POSITION_PENALTY:
        return <MapPin className="h-4 w-4" />;

      case PenaltyType.WARNING:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: PenaltyStatus) => {
    switch (status) {
      case PenaltyStatus.APPLIED:
        return <CheckCircle className="h-4 w-4" />;
      case PenaltyStatus.NOT_APPLIED:
        return <XCircle className="h-4 w-4" />;
      case PenaltyStatus.APPEALED:
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (penalties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            Nenhuma punição encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {penalties.map((penalty) => (
        <Card key={penalty.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getPenaltyIcon(penalty.type)}
                <CardTitle className="text-lg">
                  {PenaltyService.getPenaltyTypeLabel(penalty.type)}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  className={PenaltyService.getPenaltyTypeColor(penalty.type)}
                >
                  {PenaltyService.getPenaltyTypeLabel(penalty.type)}
                </Badge>
                <Badge
                  className={PenaltyService.getPenaltyStatusColor(
                    penalty.status,
                  )}
                >
                  {getStatusIcon(penalty.status)}
                  <span className="ml-1">
                    {PenaltyService.getPenaltyStatusLabel(penalty.status)}
                  </span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Motivo</h4>
                <p className="text-sm">{penalty.reason}</p>
              </div>

              {penalty.description && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600">
                    Descrição
                  </h4>
                  <p className="text-sm">{penalty.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {penalty.timePenaltySeconds && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">
                      Penalidade de Tempo
                    </h4>
                    <p className="text-sm">
                      {penalty.timePenaltySeconds} segundos
                    </p>
                  </div>
                )}

                {penalty.positionPenalty && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">
                      Penalidade de Posição
                    </h4>
                    <p className="text-sm">
                      {penalty.positionPenalty} posições
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Piloto:</span>{" "}
                  {penalty.user?.name || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Aplicada por:</span>{" "}
                  {penalty.appliedByUser?.name || "N/A"}
                </div>
                {penalty.appealedByUser && (
                  <div>
                    <span className="font-semibold">Recorrida por:</span>{" "}
                    {formatName(penalty.appealedByUser.name)}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Data:</span>{" "}
                  {formatDate(penalty.createdAt)}
                </div>
              </div>

              {penalty.appealReason && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600">
                    Motivo do Recurso
                  </h4>
                  <p className="text-sm">{penalty.appealReason}</p>
                </div>
              )}

              {showActions && (
                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  {penalty.status === PenaltyStatus.NOT_APPLIED &&
                    onApplyPenalty && (
                      <Button
                        size="sm"
                        onClick={() => onApplyPenalty(penalty.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aplicar
                      </Button>
                    )}

                  {penalty.status === PenaltyStatus.APPLIED &&
                    onAppealPenalty && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAppealPenalty(penalty.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Recorrer
                      </Button>
                    )}

                  {penalty.status !== PenaltyStatus.NOT_APPLIED &&
                    onCancelPenalty && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancelPenalty(penalty.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}

                  {onEditPenalty && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditPenalty(penalty)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}

                  {onDeletePenalty && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeletePenalty(penalty.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
