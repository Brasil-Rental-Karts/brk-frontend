import { Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Pagination } from "brk-design-system";
import { CheckCircle, Clock, XCircle, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SeasonRegistration, SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { Championship, ChampionshipService } from "@/lib/services/championship.service";
import { formatCurrency } from "@/utils/currency";
import { compareDates, formatDateToBrazilian } from "@/utils/date";
import { formatName } from "@/utils/name";
import { usePaymentManagement } from "@/hooks/use-payment-management";
import { useAuth } from "@/contexts/AuthContext";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { useStaffPermissions } from "@/hooks/use-staff-permissions";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/loading";

interface FinancialTabProps {
  championshipId: string;
}

export const FinancialTab = ({ championshipId }: FinancialTabProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const { user } = useAuth();
  const { permissions } = useStaffPermissions(championshipId);
  const canManagePayments = !!user && (user.role === 'admin' || user.role === 'manager' || Boolean(permissions));
  const { updatePaymentDueDate, reactivateOverduePayment, loading: pmLoading } = usePaymentManagement();

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [regs, champ] = await Promise.all([
          SeasonRegistrationService.getByChampionshipId(championshipId),
          ChampionshipService.getPublicById(championshipId),
        ]);
        if (mounted) {
          setRegistrations(regs);
          setChampionship(champ);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Erro ao carregar dados financeiros");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [championshipId]);

  const reloadData = async () => {
    try {
      setLoading(true);
      const [regs, champ] = await Promise.all([
        SeasonRegistrationService.getByChampionshipId(championshipId),
        ChampionshipService.getPublicById(championshipId),
      ]);
      setRegistrations(regs);
      setChampionship(champ);
    } catch (e: any) {
      setError(e?.message || "Erro ao recarregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Filtro por tipo de inscrição
  const [filterSeason, setFilterSeason] = useState(false);
  const [filterStage, setFilterStage] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<'paid' | 'pending' | 'overdue' | 'exempt'>>(new Set());
  const [selectedStageIds, setSelectedStageIds] = useState<Set<string>>(new Set());

  // Opções de etapas (apenas a partir de inscrições por etapa)
  const stageOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; date?: string }>();
    for (const reg of registrations) {
      if ((reg as any).inscriptionType !== 'por_etapa') continue;
      const stages: any[] = (reg as any).stages || [];
      for (const s of stages) {
        const id = s?.stage?.id || s?.stageId;
        if (!id) continue;
        if (!map.has(String(id))) {
          map.set(String(id), {
            id: String(id),
            name: s?.stage?.name || s?.name || 'Etapa',
            date: s?.stage?.date || s?.date,
          });
        }
      }
    }
    const list = Array.from(map.values());
    list.sort((a, b) => compareDates(a.date || "9999-12-31", b.date || "9999-12-31"));
    return list;
  }, [registrations]);

  const toggleStage = (id: string) => {
    setSelectedStageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStatus = (key: 'paid' | 'pending' | 'overdue' | 'exempt') => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const matchesSelectedStages = (reg: SeasonRegistration) => {
    if (!filterStage) return true; // não filtra por etapa quando o toggle de etapa estiver off
    if (selectedStageIds.size === 0) return true; // sem seleção específica => todas
    // Se for inscrição por temporada, não aplicar filtro por etapa (deve continuar aparecendo)
    if ((reg as any).inscriptionType !== 'por_etapa') return true;
    const stages: any[] = (reg as any).stages || [];
    for (const s of stages) {
      const id = s?.stage?.id || s?.stageId;
      if (id && selectedStageIds.has(String(id))) return true;
    }
    return false;
  };
  const matchesType = (type?: string) => {
    const season = filterSeason;
    const stage = filterStage;
    // Ambos selecionados ou ambos desmarcados => mostra todos
    if ((season && stage) || (!season && !stage)) return true;
    if (type === 'por_temporada') return season;
    if (type === 'por_etapa') return stage;
    return true;
  };

  const isAdminPaid = (reg: SeasonRegistration) => reg.paymentStatus === 'exempt' || reg.paymentStatus === 'direct_payment';

  const applyNetIfNeeded = (value: number, reg: SeasonRegistration) => {
      if (!championship) return value;
    if (isAdminPaid(reg)) return value; // administrativo não sofre taxa
      if (championship.commissionAbsorbedByChampionship) return value;
      const pct = Number(championship.platformCommissionPercentage) || 10;
      return value / (1 + pct / 100);
    };

  const normalizedStatus = (raw?: string) => String(raw || '').toUpperCase();
  const isPaid = (s: string) => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(s);
  const isPending = (s: string) => ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(s);
  const isOverdue = (s: string) => s === 'OVERDUE';

  type Totals = { paid: number; pending: number; overdue: number };

  const totals: Totals = useMemo(() => {
    const acc: Totals = { paid: 0, pending: 0, overdue: 0 };

    for (const reg of registrations) {
      if (!matchesType(reg.inscriptionType)) continue;
      if (!matchesSelectedStages(reg)) continue;
      const payments: any[] = (reg as any).payments || [];
      if (payments.length === 0) {
        const hasSelection = selectedStatuses.size > 0;
        const includeExempt = !hasSelection || selectedStatuses.has('exempt');
        if (isAdminPaid(reg) && includeExempt) acc.paid += Number(reg.amount) || 0;
        continue;
      }

      for (const p of payments) {
        const status = normalizedStatus(p.status);
        const value = Number(p.value) || 0;
        // Aplicar filtro de status nos totalizadores também (multi)
        const hasSelection = selectedStatuses.size > 0;
        const includePaid = !hasSelection || selectedStatuses.has('paid');
        const includePending = !hasSelection || selectedStatuses.has('pending');
        const includeOverdue = !hasSelection || selectedStatuses.has('overdue');

        if (isPaid(status) && includePaid) acc.paid += applyNetIfNeeded(value, reg);
        else if (isPending(status) && includePending) acc.pending += applyNetIfNeeded(value, reg);
        else if (isOverdue(status) && includeOverdue) acc.overdue += value; // vencido sem rateio de taxa
      }
    }

    return acc;
  }, [registrations, championship, filterSeason, filterStage, selectedStageIds, selectedStatuses]);

  type PaymentItem = {
    registrationId?: string;
    id: string;
    userName: string;
    userEmail?: string;
    value: number; // líquido quando aplicável (pendente/pago) e bruto para vencido
    status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PROCESSING' | 'REFUNDED' | 'CANCELLED' | 'EXEMPT';
    dueDate?: string;
    inscriptionType?: string;
    stageId?: string;
    stageName?: string;
    seasonInstallments?: { paid: number; total: number } | null;
    isDirect?: boolean; // pagamento direto (admin)
    rawStatus?: string; // status original quando existir pagamento
    pixCopyPaste?: string | null;
  };

  const getInstallmentProgress = (reg: SeasonRegistration): { paid: number; total: number } => {
    const payments: any[] = (reg as any).payments || [];
    let paid = 0;
    let total: number | undefined = undefined;

    for (const p of payments) {
      const s = normalizedStatus(p.status);
      if (isPaid(s)) paid += 1;
      const hinted = (p as any).installmentCount ?? (p as any)?.rawResponse?.installmentCount;
      if (typeof hinted === 'number' && hinted > 0) {
        total = Math.max(total || 0, hinted);
      }
    }

    if (total === undefined) {
      if (payments.length > 0) total = payments.length;
      else if (isAdminPaid(reg)) { total = 1; paid = 1; }
      else total = 1;
    }

    return { paid, total: total ?? 1 };
  };

  const { getStages } = useChampionshipData();
  const allStages = getStages();
  const stageById = useMemo(() => {
    const map: Record<string, any> = {};
    (allStages || []).forEach((s: any) => {
      if (s?.id) map[String(s.id)] = s;
    });
    return map;
  }, [allStages]);

  const paymentItems: PaymentItem[] = useMemo(() => {
    const result: PaymentItem[] = [];

    for (const reg of registrations) {
      if (!matchesType(reg.inscriptionType)) continue;
      if (!matchesSelectedStages(reg)) continue;
      const payments: any[] = (reg as any).payments || [];
      if (!payments || payments.length === 0) {
        // Gerar item sintético
        const isSeason = reg.inscriptionType === 'por_temporada';
        const isStage = reg.inscriptionType === 'por_etapa';
        const stagesArr: any[] = isStage ? ((reg as any).stages || []) : [];

        const pushSynthetic = (stage?: any) => {
          const base = {
            registrationId: reg.id,
            userName: formatName(reg.user?.name || 'Piloto'),
            userEmail: reg.user?.email,
            value: Number(reg.amount) || 0,
            inscriptionType: reg.inscriptionType,
            seasonInstallments: isSeason ? getInstallmentProgress(reg) : null,
            isDirect: reg.paymentStatus === 'direct_payment',
          } as Partial<PaymentItem>;

          if (stage) {
            (base as any).stageId = stage?.stage?.id || stage?.stageId || stage?.id;
            (base as any).stageName = stage?.stage?.name || stage?.name || 'Etapa';
          }

          if (reg.paymentStatus === 'exempt') {
            result.push({
              id: `${reg.id}-EXEMPT${stage ? `-${(base as any).stageId}` : ''}`,
              status: 'EXEMPT',
              rawStatus: undefined,
              dueDate: undefined,
              pixCopyPaste: null,
              ...base,
            } as PaymentItem);
          } else if (reg.paymentStatus === 'direct_payment' || reg.paymentStatus === 'paid') {
            result.push({
              id: `${reg.id}-DIRECTPAID${stage ? `-${(base as any).stageId}` : ''}`,
              status: 'PAID',
              rawStatus: undefined,
              dueDate: undefined,
              pixCopyPaste: null,
              ...base,
            } as PaymentItem);
          }
        };

        if (isStage && stagesArr.length > 0) {
          // Um item por etapa
          stagesArr.forEach((s) => pushSynthetic(s));
        } else {
          // Único item (por temporada)
          pushSynthetic();
        }
        continue;
      }

      const type = reg.inscriptionType; // 'por_temporada' | 'por_etapa'
      const stagesArr: any[] = type === 'por_etapa' ? ((reg as any).stages || []) : [];
      const seasonInstallments = type === 'por_temporada' ? getInstallmentProgress(reg) : null;

      payments.forEach((p: any, idx: number) => {
        const status = normalizedStatus(p.status);
        const rawValue = Number(p.value) || 0;
        let mappedStatus: PaymentItem['status'] | undefined = undefined;
        if (isPaid(status)) mappedStatus = 'PAID';
        else if (isOverdue(status)) mappedStatus = 'OVERDUE';
        else if (status === 'AWAITING_RISK_ANALYSIS') mappedStatus = 'PROCESSING';
        else if (isPending(status)) mappedStatus = 'PENDING';
        else if (status === 'REFUNDED') mappedStatus = 'REFUNDED';
        else if (status === 'CANCELLED') mappedStatus = 'CANCELLED';

        if (!mappedStatus) {
          return;
        }

        const value = (mappedStatus === 'PENDING' || mappedStatus === 'PAID' || mappedStatus === 'PROCESSING')
          ? applyNetIfNeeded(rawValue, reg)
          : rawValue;

        // Mapear etapa específica para inscrições por etapa
        let stageId: string | undefined;
        let stageName: string | undefined;
        if (type === 'por_etapa' && stagesArr.length > 0) {
          const stage = stagesArr[idx % stagesArr.length];
          stageId = String(stage?.stage?.id || stage?.stageId || stage?.id || '');
          stageName = stage?.stage?.name || stage?.name;
          // Se filtro por etapa está ativo, filtrar por item
          if (filterStage && selectedStageIds.size > 0) {
            if (!stageId || !selectedStageIds.has(String(stageId))) {
              return; // pular este item
            }
          }
        }

        result.push({
          registrationId: reg.id,
          id: String(p.id || `${reg.id}-${rawValue}-${status}-${stageId || 'all'}`),
          userName: formatName(reg.user?.name || 'Piloto'),
          userEmail: reg.user?.email,
          value,
          status: mappedStatus,
          dueDate: p.dueDate,
          inscriptionType: type,
          stageId,
          stageName,
          seasonInstallments,
          isDirect: false,
          rawStatus: status,
          pixCopyPaste: p.pixCopyPaste || null,
        });
      });
    }

    // Agrupar rodada dupla com base no cadastro das etapas
    const groupedKeyToItems: Record<string, PaymentItem[]> = {};
    for (const item of result) {
      if (item.inscriptionType !== 'por_etapa' || !item.stageId || !item.registrationId) continue;
      const stage = stageById[String(item.stageId)];
      if (stage?.doubleRound && stage?.doubleRoundPairId) {
        const a = String(item.stageId);
        const b = String(stage.doubleRoundPairId);
        const pairKey = [a, b].sort().join('+');
        const key = `${item.registrationId}|${pairKey}`;
        groupedKeyToItems[key] = groupedKeyToItems[key] || [];
        groupedKeyToItems[key].push(item);
      }
    }

    const toRemove = new Set<string>();
    const toAdd: PaymentItem[] = [];
    Object.entries(groupedKeyToItems).forEach(([key, items]) => {
      const uniqueStageIds = Array.from(new Set(items.map(it => String(it.stageId))).values());
      if (uniqueStageIds.length < 2) return; // precisa ter as duas etapas do par

      // Agregar nomes
      const names = uniqueStageIds
        .map(id => stageById[id]?.name)
        .filter((n: any): n is string => Boolean(n));
      const stageName = names.length === 2 ? `${names[0]} + ${names[1]}` : names.join(' + ');

      // Status por severidade
      const severity: Record<PaymentItem['status'], number> = {
        OVERDUE: 6,
        PENDING: 5,
        PROCESSING: 4,
        CANCELLED: 3,
        REFUNDED: 3,
        PAID: 2,
        EXEMPT: 1,
      } as const;
      const aggStatus = items.reduce((best, it) =>
        severity[it.status] > severity[best] ? it.status : best,
      items[0].status);

      // Valor somado
      const aggValue = items.reduce((sum, it) => sum + (Number(it.value) || 0), 0);
      // Menor dueDate
      const dueDates = items.map(it => it.dueDate).filter(Boolean) as string[];
      const aggDue = dueDates.length > 0 ? dueDates.sort()[0] : undefined;

      const base = items[0];
      const aggregated: PaymentItem = {
        registrationId: base.registrationId,
        id: `group-${key}`,
        userName: base.userName,
        userEmail: base.userEmail,
        value: aggValue,
        status: aggStatus,
        dueDate: aggDue,
        inscriptionType: 'por_etapa',
        stageId: uniqueStageIds.join('+'),
        stageName,
        seasonInstallments: null,
        isDirect: false,
        rawStatus: undefined,
        pixCopyPaste: base.pixCopyPaste || null,
      };

      items.forEach(it => toRemove.add(it.id));
      toAdd.push(aggregated);
    });

    const finalList = result.filter(it => !toRemove.has(it.id)).concat(toAdd);

    // Aplicar filtro de status (multi-seleção)
    const hasSelection = selectedStatuses.size > 0;
    const filtered = finalList.filter((item) => {
      if (!hasSelection) return true;
      return (
        (selectedStatuses.has('paid') && item.status === 'PAID') ||
        (selectedStatuses.has('pending') && (item.status === 'PENDING' || item.status === 'PROCESSING')) ||
        (selectedStatuses.has('overdue') && item.status === 'OVERDUE') ||
        (selectedStatuses.has('exempt') && item.status === 'EXEMPT')
      );
    });

    // Ordena por nome do piloto (asc)
    return filtered.sort((a, b) => a.userName.localeCompare(b.userName));
  }, [registrations, championship, filterSeason, filterStage, selectedStageIds, selectedStatuses]);

  // Paginação da listagem de pagamentos
  const paymentsPagination = usePagination(paymentItems.length, 10, 1);
  const paginatedPaymentItems = useMemo(() => {
    return paymentItems.slice(
      paymentsPagination.info.startIndex,
      paymentsPagination.info.endIndex,
    );
  }, [paymentItems, paymentsPagination.info.startIndex, paymentsPagination.info.endIndex]);

  const handlePaymentsPageChange = (page: number) =>
    paymentsPagination.actions.setCurrentPage(page);
  const handlePaymentsItemsPerPageChange = (items: number) =>
    paymentsPagination.actions.setItemsPerPage(items);

  // Ações de menu
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false);
  const [selectedPaymentForDueDate, setSelectedPaymentForDueDate] = useState<PaymentItem | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>("");

  const openDueDateFor = (item: PaymentItem) => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setNewDueDate(d.toISOString().split('T')[0]);
    setSelectedPaymentForDueDate(item);
    setDueDateDialogOpen(true);
  };

  const handleConfirmDueDate = async () => {
    if (!selectedPaymentForDueDate || !newDueDate) return;
    try {
      if (selectedPaymentForDueDate.status === 'OVERDUE') {
        const resp = await reactivateOverduePayment(selectedPaymentForDueDate.id, newDueDate);
        toast.success('Vencimento atualizado e fatura reativada');
        const pix = (resp as any)?.pixCopyPaste;
        if (pix) {
          try { await navigator.clipboard.writeText(pix); toast.success('Novo código PIX copiado'); } catch {}
        }
      } else if (selectedPaymentForDueDate.status === 'PENDING') {
        await updatePaymentDueDate(selectedPaymentForDueDate.id, newDueDate);
        toast.success('Vencimento atualizado');
      }
      setDueDateDialogOpen(false);
      setSelectedPaymentForDueDate(null);
      setNewDueDate("");
      await reloadData();
    } catch (e) {
      // erros são tratados pelo hook (toast)
    }
  };

  const handleCopyPix = async (item: PaymentItem) => {
    try {
      if (!item.pixCopyPaste) { toast.error('Nenhum código PIX disponível'); return; }
      await navigator.clipboard.writeText(item.pixCopyPaste);
      toast.success('Código PIX copiado');
    } catch {
      toast.error('Falha ao copiar código PIX');
    }
  };

  if (loading) {
    return (
      <PageLoader />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Totalizadores */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros (moderno, com labels e melhor uso de espaço) */}
      <div className="grid gap-3 md:gap-4">
        {/* Bloco: Tipo de inscrição */}
        <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-muted-foreground">Tipo de inscrição</div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                size="sm"
                variant={filterSeason ? 'default' : 'outline'}
                onClick={() => setFilterSeason(v => !v)}
              >
                Por temporada
              </Button>
                <Button
                  size="sm"
                variant={filterStage ? 'default' : 'outline'}
                onClick={() => setFilterStage(v => !v)}
                >
                Por etapa
                </Button>
            </div>
              </div>
          {filterStage && stageOptions.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-muted-foreground">Filtrar por etapas</div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {stageOptions.map((st) => (
                  <Button
                      key={st.id}
                    size="sm"
                      variant={selectedStageIds.has(st.id) ? 'default' : 'outline'}
                      onClick={() => toggleStage(st.id)}
                      title={st.date ? new Date(st.date).toLocaleDateString('pt-BR') : undefined}
                    >
                      {st.name}
                  </Button>
                ))}
                </div>
              </div>
            </div>
                )}
              </div>

        {/* Bloco: Status dos pagamentos */}
        <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-muted-foreground">Status dos pagamentos</div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button size="sm" variant={selectedStatuses.has('paid') ? 'default' : 'outline'} onClick={() => toggleStatus('paid')}>Pagos</Button>
              <Button size="sm" variant={selectedStatuses.has('pending') ? 'default' : 'outline'} onClick={() => toggleStatus('pending')}>Pendentes</Button>
              <Button size="sm" variant={selectedStatuses.has('overdue') ? 'default' : 'outline'} onClick={() => toggleStatus('overdue')}>Em atraso</Button>
              <Button size="sm" variant={selectedStatuses.has('exempt') ? 'default' : 'outline'} onClick={() => toggleStatus('exempt')}>Isentos</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Listagem achatada de pagamentos (todos os status) */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {paymentItems.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">Nenhum pagamento encontrado.</div>
          ) : (
            <div className="divide-y">
              {paginatedPaymentItems.map((item) => {
                const dueStr = item.dueDate ? formatDateToBrazilian(item.dueDate) : '-';
                const isSeason = item.inscriptionType === 'por_temporada';
                const isStage = item.inscriptionType === 'por_etapa';
                return (
                  <div key={item.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                      <div className="font-medium truncate">{item.userName}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.userEmail}</div>
                      <div className="text-xs text-muted-foreground">Vencimento: {dueStr}</div>
                      </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {item.status === 'OVERDUE' && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>
                        )}
                      {item.status === 'PENDING' && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
                        )}
                      {item.status === 'PROCESSING' && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em análise</Badge>
                      )}
                      {item.status === 'REFUNDED' && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Reembolsado</Badge>
                        )}
                      {item.status === 'CANCELLED' && (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelado</Badge>
                        )}
                      {item.status === 'PAID' && !item.isDirect && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>
                        )}
                      {item.status === 'PAID' && item.isDirect && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Pagamento Direto</Badge>
                        )}
                      {item.status === 'EXEMPT' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Isento</Badge>
                        )}

                      {isSeason && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Por Temporada</Badge>
                      )}
                      {/* Removido: informação de parcelas para inscrições por temporada */}

                      {isStage && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">Por Etapa</Badge>
                      )}
                      {isStage && item.stageName && (
                        <Badge variant="outline">{item.stageName}</Badge>
                      )}

                      <div className="text-right text-sm font-semibold ml-2">
                        {formatCurrency(item.value)}
                            </div>

                      {canManagePayments && (item.status === 'PENDING' || item.status === 'OVERDUE') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="outline">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {item.status === 'PENDING' && (
                              <>
                                {item.pixCopyPaste && (
                                  <DropdownMenuItem onClick={() => handleCopyPix(item)}>
                                    Copiar PIX
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openDueDateFor(item)}>
                                  Alterar vencimento
                                </DropdownMenuItem>
                              </>
                            )}
                            {item.status === 'OVERDUE' && (
                              <DropdownMenuItem onClick={() => openDueDateFor(item)}>
                                Reativar/Alterar vencimento
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
          )}
          </CardContent>
        </Card>

      {/* Paginação */}
      {paymentItems.length > 0 && (
        <div className="flex-shrink-0">
          <Pagination
            currentPage={paymentsPagination.state.currentPage}
            totalPages={paymentsPagination.info.totalPages}
            itemsPerPage={paymentsPagination.state.itemsPerPage}
            totalItems={paymentsPagination.state.totalItems}
            startIndex={paymentsPagination.info.startIndex}
            endIndex={paymentsPagination.info.endIndex}
            hasNextPage={paymentsPagination.info.hasNextPage}
            hasPreviousPage={paymentsPagination.info.hasPreviousPage}
            onPageChange={handlePaymentsPageChange}
            onItemsPerPageChange={handlePaymentsItemsPerPageChange}
          />
        </div>
      )}

      {/* Dialog: alterar vencimento */}
      <Dialog open={dueDateDialogOpen} onOpenChange={setDueDateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Alterar Data de Vencimento</DialogTitle>
            <DialogDescription>
              Defina uma nova data de vencimento para {selectedPaymentForDueDate?.status === 'OVERDUE' ? 'reativar a fatura' : 'atualizar a cobrança'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPaymentForDueDate && (
              <div className="border rounded-lg p-4 bg-muted/50 text-sm">
                <div><span className="text-muted-foreground">Piloto:</span> <span className="font-semibold">{selectedPaymentForDueDate.userName}</span></div>
                <div><span className="text-muted-foreground">Valor:</span> <span className="font-semibold">{formatCurrency(selectedPaymentForDueDate.value || 0)}</span></div>
                <div><span className="text-muted-foreground">Vencimento Atual:</span> <span className="font-semibold">{selectedPaymentForDueDate.dueDate ? formatDateToBrazilian(selectedPaymentForDueDate.dueDate) : '-'}</span></div>
              </div>
            )}
            <div className="space-y-2">
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              <p className="text-xs text-muted-foreground">A nova data deve ser posterior à data atual.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDueDateDialogOpen(false)} disabled={pmLoading}>Cancelar</Button>
            <Button onClick={handleConfirmDueDate} disabled={!newDueDate || pmLoading}>{pmLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


