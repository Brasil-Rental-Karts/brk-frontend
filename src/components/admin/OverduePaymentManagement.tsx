import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "brk-design-system";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

import { usePaymentManagement } from "@/hooks/use-payment-management";
import { OverduePayment } from "@/lib/services/payment-management.service";
import { formatCurrency } from "@/utils/currency";
import { formatDateToBrazilian } from "@/utils/date";

interface OverduePaymentManagementProps {
  registrationId: string;
  onPaymentReactivated?: () => void;
}

export const OverduePaymentManagement = ({
  registrationId,
  onPaymentReactivated,
}: OverduePaymentManagementProps) => {
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<OverduePayment | null>(
    null,
  );
  const [newDueDate, setNewDueDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { loading, error, getOverduePayments, reactivateOverduePayment } =
    usePaymentManagement();

  useEffect(() => {
    loadOverduePayments();
  }, [registrationId]);

  const loadOverduePayments = async () => {
    try {
      const payments = await getOverduePayments(registrationId);
      setOverduePayments(payments);
    } catch (error) {
      console.error("Erro ao carregar pagamentos vencidos:", error);
    }
  };

  const handleReactivatePayment = async () => {
    if (!selectedPayment || !newDueDate) return;

    try {
      await reactivateOverduePayment(selectedPayment.id, newDueDate);
      setIsDialogOpen(false);
      setSelectedPayment(null);
      setNewDueDate("");

      // Recarregar pagamentos vencidos
      await loadOverduePayments();

      // Notificar componente pai
      onPaymentReactivated?.();
    } catch (error) {
      console.error("Erro ao reativar pagamento:", error);
    }
  };

  const openReactivateDialog = (payment: OverduePayment) => {
    setSelectedPayment(payment);
    // Definir data padrão como 7 dias a partir de hoje
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setNewDueDate(defaultDate.toISOString().split("T")[0]);
    setIsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OVERDUE":
        return <Badge variant="destructive">Vencido</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pendente</Badge>;
      case "CONFIRMED":
        return <Badge variant="default">Confirmado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && overduePayments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Carregando pagamentos vencidos...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (overduePayments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">
              Nenhum pagamento vencido encontrado
            </p>
            <p className="text-sm">
              Todos os pagamentos estão em dia ou já foram pagos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Pagamentos Vencidos
          </CardTitle>
          <CardDescription>
            Gerencie faturas vencidas por PIX. Você pode reativar faturas
            alterando a data de vencimento e gerando um novo QR Code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {overduePayments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span className="font-medium">
                      Parcela {payment.installmentNumber || 1}
                      {payment.installmentCount &&
                        payment.installmentCount > 1 &&
                        ` de ${payment.installmentCount}`}
                    </span>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Piloto:</span>
                    <div className="font-semibold">
                      {payment.registration?.user?.name ||
                        "Nome não disponível"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Competição:</span>
                    <div className="font-semibold">
                      {payment.registration?.season?.championship?.name &&
                      payment.registration?.season?.name
                        ? `${payment.registration.season.championship.name} / ${payment.registration.season.name}`
                        : "Não disponível"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <div className="font-semibold">
                      {formatCurrency(payment.value || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vencimento:</span>
                    <div className="font-semibold">
                      {formatDateToBrazilian(payment.dueDate)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => openReactivateDialog(payment)}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reativar Fatura
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reativar Fatura Vencida</DialogTitle>
            <DialogDescription>
              Defina uma nova data de vencimento para reativar a fatura. Um novo
              QR Code PIX será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPayment && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">Detalhes da Fatura</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Piloto:</span>
                    <div className="font-semibold">
                      {selectedPayment.registration?.user?.name ||
                        "Nome não disponível"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <div className="font-semibold">
                      {formatCurrency(selectedPayment.value || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Competição:</span>
                    <div className="font-semibold">
                      {selectedPayment.registration?.season?.championship
                        ?.name && selectedPayment.registration?.season?.name
                        ? `${selectedPayment.registration.season.championship.name} / ${selectedPayment.registration.season.name}`
                        : "Não disponível"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Vencimento Atual:
                    </span>
                    <div className="font-semibold">
                      {formatDateToBrazilian(selectedPayment.dueDate)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newDueDate">Nova Data de Vencimento</Label>
              <Input
                id="newDueDate"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                A nova data deve ser posterior à data atual.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReactivatePayment}
              disabled={loading || !newDueDate}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Reativando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reativar Fatura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
