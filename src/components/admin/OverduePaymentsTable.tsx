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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "brk-design-system";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  Filter,
  RefreshCw,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";

import { usePaymentManagement } from "@/hooks/use-payment-management";
import { OverduePayment } from "@/lib/services/payment-management.service";
import { formatCurrency } from "@/utils/currency";
import { formatDateToBrazilian, compareDates } from "@/utils/date";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePagination } from "@/hooks/usePagination";
import { InlineLoader } from "@/components/ui/loading";

export const OverduePaymentsTable = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'overdue' | 'pending'>('overdue');
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<OverduePayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<OverduePayment[]>(
    [],
  );
  const [filteredPending, setFilteredPending] = useState<OverduePayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<OverduePayment | null>(
    null,
  );
  const [newDueDate, setNewDueDate] = useState("");
  const [newValue, setNewValue] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditValueDialogOpen, setIsEditValueDialogOpen] = useState(false);
  const [isDueDateDialogOpen, setIsDueDateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "dueDate" | "value" | "registrationId"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);

  const { loading, error, getAllOverduePayments, getAllPendingPayments, reactivateOverduePayment, updatePaymentValue, updatePaymentDueDate } =
    usePaymentManagement();

  // Paginação (desktop)
  const overduePagination = usePagination(filteredPayments.length, 10, 1);
  const pendingPagination = usePagination(filteredPending.length, 10, 1);
  const paginatedOverdue = isMobile
    ? filteredPayments
    : filteredPayments.slice(
        overduePagination.info.startIndex,
        overduePagination.info.endIndex,
      );
  const paginatedPending = isMobile
    ? filteredPending
    : filteredPending.slice(
        pendingPagination.info.startIndex,
        pendingPagination.info.endIndex,
      );

  useEffect(() => {
    loadAllPayments();
  }, []);

  useEffect(() => {
    filterAndSortPayments();
  }, [overduePayments, pendingPayments, searchTerm, sortBy, sortOrder]);

  const loadAllPayments = async () => {
    try {
      const [overdues, pendings] = await Promise.all([
        getAllOverduePayments(),
        getAllPendingPayments(),
      ]);
      setOverduePayments(overdues);
      setPendingPayments(pendings);
    } catch (error) {
      console.error("Erro ao carregar pagamentos vencidos:", error);
    }
  };

  const filterAndSortPayments = () => {
    let filtered = overduePayments;
    let filteredP = pendingPayments;

    // Filtrar por termo de busca
    if (searchTerm) {
      const match = (p: OverduePayment) =>
        p.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.registration?.user?.name &&
          p.registration.user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (p.registration?.user?.email &&
          p.registration.user.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (p.registration?.season?.championship?.name &&
          p.registration.season.championship.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (p.registration?.season?.name &&
          p.registration.season.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      filtered = filtered.filter(match);
      filteredP = filteredP.filter(match);
    }

    // Ordenar
    const sorter = (a: any, b: any) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = (a.registration?.user?.name || "").toLowerCase();
          bValue = (b.registration?.user?.name || "").toLowerCase();
          break;
        case "dueDate":
          aValue = a.dueDate || "9999-12-31";
          bValue = b.dueDate || "9999-12-31";
          break;
        case "value":
          aValue = a.value;
          bValue = b.value;
          break;
        case "registrationId":
          aValue = a.registrationId;
          bValue = b.registrationId;
          break;
        default:
          return 0;
      }

      if (sortBy === "dueDate") {
        const cmp = compareDates(aValue, bValue);
        return sortOrder === "asc" ? cmp : -cmp;
      }
      if (sortOrder === "asc") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    };

    filtered.sort(sorter);
    filteredP.sort(sorter);

    setFilteredPayments(filtered);
    setFilteredPending(filteredP);
  };

  const handleReactivatePayment = async () => {
    if (!selectedPayment || !newDueDate) return;

    try {
      await reactivateOverduePayment(selectedPayment.id, newDueDate);
      setIsDialogOpen(false);
      setSelectedPayment(null);
      setNewDueDate("");

      // Recarregar pagamentos
      await loadAllPayments();
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

  const openEditValueDialog = (payment: OverduePayment) => {
    setSelectedPayment(payment);
    setNewValue(String(payment.value || ""));
    setIsEditValueDialogOpen(true);
  };

  const openDueDateDialog = (payment: OverduePayment) => {
    setSelectedPayment(payment);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setNewDueDate(defaultDate.toISOString().split("T")[0]);
    setIsDueDateDialogOpen(true);
  };

  const handleSort = (
    column: "name" | "dueDate" | "value" | "registrationId",
  ) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
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

  const handleCopyPix = async (payment: OverduePayment) => {
    if (!payment.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(payment.pixCopyPaste);
      setCopiedPaymentId(payment.id);
      setTimeout(() => setCopiedPaymentId(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar PIX:", err);
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
            {!isMobile && (
              <div className="mt-4">
                <Pagination
                  currentPage={overduePagination.state.currentPage}
                  totalPages={overduePagination.info.totalPages}
                  itemsPerPage={overduePagination.state.itemsPerPage}
                  totalItems={overduePagination.state.totalItems}
                  startIndex={overduePagination.info.startIndex}
                  endIndex={overduePagination.info.endIndex}
                  hasNextPage={overduePagination.info.hasNextPage}
                  hasPreviousPage={overduePagination.info.hasPreviousPage}
                  onPageChange={overduePagination.actions.setCurrentPage}
                  onItemsPerPageChange={overduePagination.actions.setItemsPerPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Pagamentos</CardTitle>
          <CardDescription>Gerencie faturas por status</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do piloto, email ou competição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={loadAllPayments}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 h-auto sm:h-10 gap-2 mb-4">
              <TabsTrigger
                value="overdue"
                className="text-xs sm:text-sm py-2 text-center whitespace-nowrap"
              >
                Vencidos
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="text-xs sm:text-sm py-2 text-center whitespace-nowrap"
              >
                Pendentes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overdue" className="mt-2 sm:mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredPayments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Faturas Vencidas</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      filteredPayments.reduce(
                        (sum, p) => sum + (Number(p.value) || 0),
                        0,
                      ),
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {overduePayments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total no Sistema</div>
                </div>
              </div>

          {/* Lista: Vencidos */}
          {!isMobile ? (
            <div className="rounded-md border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Piloto / Competição
                      <Filter className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("dueDate")}
                  >
                    <div className="flex items-center gap-1">
                      Vencimento
                      <Filter className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("value")}
                  >
                    <div className="flex items-center gap-1">
                      Valor
                      <Filter className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOverdue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "Nenhum pagamento encontrado para a busca."
                          : "Nenhum pagamento vencido encontrado."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOverdue.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.registration?.user?.name ||
                              "Nome não disponível"}
                          </div>
                          {payment.registration?.season?.championship?.name &&
                            payment.registration?.season?.name && (
                              <div className="text-sm text-muted-foreground">
                                {payment.registration.season.championship.name}{" "}
                                / {payment.registration.season.name}
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDateToBrazilian(payment.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(payment.value || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.installmentNumber || 1}
                          {payment.installmentCount &&
                            payment.installmentCount > 1 &&
                            ` de ${payment.installmentCount}`}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEditValueDialog(payment)}
                            disabled={loading}
                            size="sm"
                            variant="outline"
                          >
                            Editar Valor
                          </Button>
                          <Button
                            onClick={() => openReactivateDialog(payment)}
                            disabled={loading}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Reativar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum pagamento vencido encontrado.
                </div>
              ) : (
                filteredPayments.map((payment) => (
                  <Card key={payment.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">
                          {payment.registration?.user?.name ||
                            "Nome não disponível"}
                        </div>
                        {payment.registration?.season?.championship?.name &&
                          payment.registration?.season?.name && (
                            <div className="text-sm text-muted-foreground">
                              {payment.registration.season.championship.name} / {payment.registration.season.name}
                            </div>
                          )}
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Vencimento</span>
                        <div className="font-medium">{formatDateToBrazilian(payment.dueDate)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor</span>
                        <div className="font-medium">{formatCurrency(payment.value || 0)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Parcela</span>
                        <div className="font-medium">
                          {payment.installmentNumber || 1}
                          {payment.installmentCount && payment.installmentCount > 1 && ` de ${payment.installmentCount}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <Button
                        onClick={() => openEditValueDialog(payment)}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        Editar Valor
                      </Button>
                      <Button
                        onClick={() => openReactivateDialog(payment)}
                        disabled={loading}
                        size="sm"
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reativar
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
            </TabsContent>

            <TabsContent value="pending" className="mt-2 sm:mt-4">
              {/* Estatísticas Pendentes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold">{filteredPending.length}</div>
                  <div className="text-sm text-muted-foreground">Faturas Pendentes</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      filteredPending.reduce(
                        (sum, p) => sum + (Number(p.value) || 0),
                        0,
                      ),
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {pendingPayments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total no Sistema</div>
                </div>
              </div>
              {!isMobile ? (
              <div className="rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Piloto / Competição
                        <Filter className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("dueDate")}
                    >
                      <div className="flex items-center gap-1">
                        Vencimento
                        <Filter className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("value")}
                    >
                      <div className="flex items-center gap-1">
                        Valor
                        <Filter className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "Nenhum pagamento encontrado para a busca."
                            : "Nenhum pagamento pendente encontrado."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPending.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payment.registration?.user?.name ||
                                "Nome não disponível"}
                            </div>
                            {payment.registration?.season?.championship?.name &&
                              payment.registration?.season?.name && (
                                <div className="text-sm text-muted-foreground">
                                  {payment.registration.season.championship.name}{" "}
                                  / {payment.registration.season.name}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateToBrazilian(payment.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(payment.value || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {payment.installmentNumber || 1}
                            {payment.installmentCount &&
                              payment.installmentCount > 1 &&
                              ` de ${payment.installmentCount}`}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => openEditValueDialog(payment)}
                              disabled={loading}
                              size="sm"
                              variant="outline"
                            >
                              Editar Valor
                            </Button>
                            {payment.pixCopyPaste && (
                              <Button
                                onClick={() => handleCopyPix(payment)}
                                disabled={loading}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                {copiedPaymentId === payment.id ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Copiado!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copiar PIX
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              onClick={() => openDueDateDialog(payment)}
                              disabled={loading}
                              size="sm"
                              variant="outline"
                            >
                              Alterar Vencimento
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPending.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhum pagamento pendente encontrado.
                  </div>
                ) : (
                  filteredPending.map((payment) => (
                    <Card key={payment.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">
                            {payment.registration?.user?.name || "Nome não disponível"}
                          </div>
                          {payment.registration?.season?.championship?.name &&
                            payment.registration?.season?.name && (
                              <div className="text-sm text-muted-foreground">
                                {payment.registration.season.championship.name} / {payment.registration.season.name}
                              </div>
                            )}
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Vencimento</span>
                          <div className="font-medium">{formatDateToBrazilian(payment.dueDate)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor</span>
                          <div className="font-medium">{formatCurrency(payment.value || 0)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Parcela</span>
                          <div className="font-medium">
                            {payment.installmentNumber || 1}
                            {payment.installmentCount && payment.installmentCount > 1 && ` de ${payment.installmentCount}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button
                          onClick={() => openEditValueDialog(payment)}
                          disabled={loading}
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          Editar Valor
                        </Button>
                        {payment.pixCopyPaste && (
                          <Button
                            onClick={() => handleCopyPix(payment)}
                            disabled={loading}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2 w-full sm:w-auto"
                          >
                            {copiedPaymentId === payment.id ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar PIX
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={() => openDueDateDialog(payment)}
                          disabled={loading}
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          Alterar Vencimento
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
            {!isMobile && (
              <div className="mt-4">
                <Pagination
                  currentPage={pendingPagination.state.currentPage}
                  totalPages={pendingPagination.info.totalPages}
                  itemsPerPage={pendingPagination.state.itemsPerPage}
                  totalItems={pendingPagination.state.totalItems}
                  startIndex={pendingPagination.info.startIndex}
                  endIndex={pendingPagination.info.endIndex}
                  hasNextPage={pendingPagination.info.hasNextPage}
                  hasPreviousPage={pendingPagination.info.hasPreviousPage}
                  onPageChange={pendingPagination.actions.setCurrentPage}
                  onItemsPerPageChange={pendingPagination.actions.setItemsPerPage}
                />
              </div>
            )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
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
                  <div>
                    <span className="text-muted-foreground">Parcela:</span>
                    <div className="font-semibold">
                      {selectedPayment.installmentNumber || 1}
                      {selectedPayment.installmentCount &&
                        selectedPayment.installmentCount > 1 &&
                        ` de ${selectedPayment.installmentCount}`}
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

      {/* Editar Valor */}
      <Dialog open={isEditValueDialogOpen} onOpenChange={setIsEditValueDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Editar Valor da Cobrança</DialogTitle>
            <DialogDescription>
              Altere o valor da cobrança. Se for PIX, um novo QR Code poderá ser gerado ao reabrir o vencimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPayment && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Piloto:</span>
                    <div className="font-semibold">
                      {selectedPayment.registration?.user?.name || "Nome não disponível"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor Atual:</span>
                    <div className="font-semibold">{formatCurrency(selectedPayment.value || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newValue">Novo Valor (R$)</Label>
              <Input
                id="newValue"
                type="number"
                min="0.01"
                step="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Informe o novo valor da cobrança.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditValueDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selectedPayment) return;
                const parsed = Number(newValue);
                if (!parsed || parsed <= 0) return;
                try {
                  await updatePaymentValue(selectedPayment.id, parsed);
                  setIsEditValueDialogOpen(false);
                  setSelectedPayment(null);
                  setNewValue("");
                  await loadAllPayments();
                } catch (e) {
                  // erro já tratado no hook
                }
              }}
              disabled={loading || !newValue}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alterar Vencimento (Pendentes) */}
      <Dialog open={isDueDateDialogOpen} onOpenChange={setIsDueDateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Alterar Data de Vencimento</DialogTitle>
            <DialogDescription>
              Defina uma nova data de vencimento para a cobrança pendente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPayment && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Piloto:</span>
                    <div className="font-semibold">
                      {selectedPayment.registration?.user?.name || "Nome não disponível"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vencimento Atual:</span>
                    <div className="font-semibold">{formatDateToBrazilian(selectedPayment.dueDate)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pendingNewDueDate">Nova Data de Vencimento</Label>
              <Input
                id="pendingNewDueDate"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">A nova data deve ser posterior à data atual.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDueDateDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selectedPayment || !newDueDate) return;
                try {
                  await updatePaymentDueDate(selectedPayment.id, newDueDate);
                  setIsDueDateDialogOpen(false);
                  setSelectedPayment(null);
                  setNewDueDate("");
                  await loadAllPayments();
                } catch (e) {}
              }}
              disabled={loading || !newDueDate}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
