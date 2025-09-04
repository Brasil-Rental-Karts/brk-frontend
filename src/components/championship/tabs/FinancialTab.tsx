import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Alert, AlertDescription, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input } from "brk-design-system";
import { CheckCircle, Clock, XCircle, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SeasonRegistration, SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";
import { formatName } from "@/utils/name";
import { usePaymentManagement } from "@/hooks/use-payment-management";
import { toast } from "sonner";
// Utilitário local para mascarar telefone brasileiro (formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX)
const formatPhoneBR = (raw?: string) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 10) return raw; // fallback
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  // Celular 9 dígitos
  if (rest.length >= 9) {
    const first = rest.slice(0, 5);
    const last = rest.slice(5, 9);
    return `(${ddd}) ${first}-${last}`;
  }
  // Fixo 8 dígitos
  const first = rest.slice(0, 4);
  const last = rest.slice(4, 8);
  return `(${ddd}) ${first}-${last}`;
};

// Link tel: a partir de um telefone bruto
const toTelHref = (raw?: string) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return `tel:${digits}`;
};

interface FinancialTabProps {
  championshipId: string;
}

export const FinancialTab = ({ championshipId }: FinancialTabProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<SeasonRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await SeasonRegistrationService.getByChampionshipId(championshipId);
        if (mounted) setRegistrations(data);
      } catch (e: any) {
        if (mounted) setError(e.message || "Erro ao carregar inscrições do campeonato");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [championshipId]);

  type Aggregated = {
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    totalAmount: number;
    totalRegistrations: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };

  const aggregatePayments = (regs: SeasonRegistration[]) => {
    const acc: Aggregated = {
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      totalAmount: 0,
      totalRegistrations: regs.length,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    };

    for (const reg of regs) {
      acc.totalAmount += Number(reg.amount) || 0;
      const payments = (reg as any).payments || [];
      let paid = 0;
      let pending = 0;
      let overdue = 0;

      if (Array.isArray(payments) && payments.length > 0) {
        for (const p of payments) {
          const status = String(p.status || '').toUpperCase();
          const value = Number(p.value) || 0;
          if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status)) {
            paid += value;
          } else if (status === 'OVERDUE') {
            overdue += value;
          } else if (['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(status)) {
            pending += value;
          }
        }
      } else {
        // Inscrições administrativas sem pagamentos: considerar como pago
        if (reg.paymentStatus === 'exempt' || reg.paymentStatus === 'direct_payment') {
          paid += Number(reg.amount) || 0;
        }
      }

      acc.paidAmount += paid;
      acc.pendingAmount += pending;
      acc.overdueAmount += overdue;

      if (overdue > 0) acc.overdueCount += 1;
      else if (pending > 0) acc.pendingCount += 1;
      else if (paid > 0 || reg.paymentStatus === 'paid') acc.paidCount += 1;
      else acc.pendingCount += 1;
    }
    return acc;
  };

  const seasonGroups = useMemo(() => {
    const map = new Map<string, SeasonRegistration[]>();
    for (const reg of registrations) {
      const seasonId = reg.season?.id || reg.seasonId;
      if (!seasonId) continue;
      if (!map.has(seasonId)) map.set(seasonId, []);
      map.get(seasonId)!.push(reg);
    }
    return Array.from(map.entries()).map(([seasonId, regs]) => {
      const seasonOnly = regs.filter(r => r.inscriptionType === 'por_temporada');
      return {
        seasonId,
        seasonName: regs[0]?.season?.name || "Temporada",
        ...aggregatePayments(seasonOnly),
      };
    });
  }, [registrations]);

  const stageGroups = useMemo(() => {
    type StageAgg = Aggregated & { stageId: string; stageName: string; stageDate?: string };
    const result: { seasonId: string; seasonName: string; stages: StageAgg[] }[] = [];

    const bySeason = new Map<string, SeasonRegistration[]>();
    for (const reg of registrations) {
      const seasonId = reg.season?.id || reg.seasonId;
      if (!seasonId) continue;
      if (!bySeason.has(seasonId)) bySeason.set(seasonId, []);
      bySeason.get(seasonId)!.push(reg);
    }

    for (const [seasonId, regs] of bySeason.entries()) {
      const byStage = new Map<string, SeasonRegistration[]>();
      const stageMeta = new Map<string, { name: string; date?: string }>();
      for (const reg of regs) {
        if (reg.inscriptionType !== 'por_etapa') continue;
        // Para inscrições por etapa, cada reg pode ter várias etapas vinculadas
        const stages = (reg as any).stages || [];
        if (Array.isArray(stages) && stages.length > 0) {
          for (const s of stages) {
            const id = s.stage?.id || s.stageId;
            if (!id) continue;
            if (!byStage.has(id)) byStage.set(id, []);
            byStage.get(id)!.push(reg);
            if (!stageMeta.has(id)) {
              stageMeta.set(id, {
                name: s.stage?.name || 'Etapa',
                date: s.stage?.date || s.date,
              });
            }
          }
        }
      }

      const stagesAgg: StageAgg[] = Array.from(byStage.entries()).map(([stageId, regsForStage]) => {
        // Agregar com rateio por etapa quando inscrição for por_etapa
        const acc: Aggregated = {
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          totalAmount: 0,
          totalRegistrations: regsForStage.length,
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0,
        };

        for (const reg of regsForStage) {
          const totalStages = Array.isArray((reg as any).stages) && (reg as any).stages.length > 0 ? (reg as any).stages.length : 1;
          const share = reg.inscriptionType === 'por_etapa' ? 1 / totalStages : 1; // ratear apenas inscrições por etapa
          acc.totalAmount += (Number(reg.amount) || 0) * share;

          const payments = (reg as any).payments || [];
          let paid = 0, pending = 0, overdue = 0;
          if (Array.isArray(payments) && payments.length > 0) {
            for (const p of payments) {
              const status = String(p.status || '').toUpperCase();
              const value = (Number(p.value) || 0) * share;
              if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status)) paid += value;
              else if (status === 'OVERDUE') overdue += value;
              else if (['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(status)) pending += value;
            }
          } else if (reg.paymentStatus === 'exempt' || reg.paymentStatus === 'direct_payment') {
            paid += (Number(reg.amount) || 0) * share;
          }

          acc.paidAmount += paid;
          acc.pendingAmount += pending;
          acc.overdueAmount += overdue;

          if (overdue > 0) acc.overdueCount += 1;
          else if (pending > 0) acc.pendingCount += 1;
          else if (paid > 0 || reg.paymentStatus === 'paid') acc.paidCount += 1;
          else acc.pendingCount += 1;
        }

        const meta = stageMeta.get(stageId);
        return {
          ...acc,
          stageId,
          stageName: meta?.name || 'Etapa',
          stageDate: meta?.date,
        };
      })
      // Ordenar por data decrescente (mais recente primeiro)
      .sort((a, b) => {
        const da = a.stageDate ? new Date(a.stageDate).getTime() : 0;
        const db = b.stageDate ? new Date(b.stageDate).getTime() : 0;
        return db - da;
      });

      result.push({
        seasonId,
        seasonName: regs[0]?.season?.name || "Temporada",
        stages: stagesAgg,
      });
    }

    return result;
  }, [registrations]);

  // Seletor de temporada/etapa (deve vir antes de qualquer retorno condicional)
  const [selectedSeason, setSelectedSeason] = useState<{ id: string; name: string } | null>(null);
  const [selectedStage, setSelectedStage] = useState<{ id: string; seasonId: string; stageName: string; seasonName: string } | null>(null);

  // Filtro de status para listagem de pilotos
  const [statusFilter, setStatusFilter] = useState<'all' | 'refunded' | 'overdue' | 'pending' | 'direct' | 'exempt' | 'paid'>('all');
  const filterOptions: { key: 'all' | 'refunded' | 'overdue' | 'pending' | 'direct' | 'exempt' | 'paid'; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'refunded', label: 'Reembolsado' },
    { key: 'overdue', label: 'Vencido' },
    { key: 'pending', label: 'Pendente' },
    { key: 'direct', label: 'Pagamento Direto' },
    { key: 'exempt', label: 'Isento' },
    { key: 'paid', label: 'Pago' },
  ];
  const statusLabel: Record<typeof filterOptions[number]['key'], string> = {
    all: 'Todos',
    refunded: 'Reembolsado',
    overdue: 'Vencido',
    pending: 'Pendente',
    direct: 'Pagamento Direto',
    exempt: 'Isento',
    paid: 'Pago',
  };

  // Ações de pagamento (PIX): copiar código e atualizar vencimento
  const { updatePaymentDueDate } = usePaymentManagement();
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedPaymentInfo, setSelectedPaymentInfo] = useState<{ pilot?: string; value?: number; dueDate?: string } | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>("");

  const findEligiblePayment = (reg: SeasonRegistration) => {
    const payments: any[] = ((reg as any).payments || []).slice();
    const eligible = payments
      .filter((p) => {
        const status = String(p.status || '').toUpperCase();
        return status === 'PENDING' || status === 'OVERDUE';
      })
      .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    return eligible[0];
  };

  const handleCopyPix = async (reg: SeasonRegistration) => {
    try {
      const payments: any[] = (reg as any).payments || [];
      const withPix = payments.find((p) => p.pixCopyPaste);
      if (!withPix) {
        toast.error('Nenhum código PIX disponível');
        return;
      }
      await navigator.clipboard.writeText(withPix.pixCopyPaste);
      toast.success('Código PIX copiado');
    } catch (e) {
      toast.error('Falha ao copiar código PIX');
    }
  };

  const openDueDateDialog = (reg: SeasonRegistration) => {
    const payment = findEligiblePayment(reg);
    if (!payment) {
      toast.error('Nenhuma cobrança elegível para atualizar vencimento');
      return;
    }
    setSelectedPaymentId(payment.id);
    setSelectedPaymentInfo({ pilot: (reg as any)?.user?.name, value: payment.value, dueDate: payment.dueDate });
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setNewDueDate(d.toISOString().split('T')[0]);
    setDueDateDialogOpen(true);
  };

  const handleConfirmUpdateDueDate = async () => {
    if (!selectedPaymentId || !newDueDate) return;
    try {
      await updatePaymentDueDate(selectedPaymentId, newDueDate);
      toast.success('Vencimento atualizado');
      setDueDateDialogOpen(false);
      setSelectedPaymentId(null);
      setSelectedPaymentInfo(null);
      setNewDueDate("");
    } catch (e: any) {
      // O hook já toasta erro
    }
  };

  const sumAmountsByStatus = (reg: SeasonRegistration) => {
    const payments = (reg as any).payments || [];
    let pending = 0,
      overdue = 0,
      paid = 0,
      refunded = 0,
      cancelled = 0,
      processing = 0;

    if (Array.isArray(payments) && payments.length > 0) {
      for (const p of payments) {
        const status = String(p.status || '').toUpperCase();
        const value = Number(p.value) || 0;
        if (status === 'OVERDUE') {
          overdue += value;
        } else if (status === 'PENDING' || status === 'AWAITING_PAYMENT') {
          pending += value;
        } else if (status === 'AWAITING_RISK_ANALYSIS') {
          processing += value;
        } else if (status === 'REFUNDED') {
          refunded += value;
        } else if (status === 'CANCELLED') {
          cancelled += value;
        } else if (
          status === 'RECEIVED' ||
          status === 'CONFIRMED' ||
          status === 'RECEIVED_IN_CASH'
        ) {
          paid += value;
        }
      }
    } else if (reg.paymentStatus === 'exempt' || reg.paymentStatus === 'direct_payment') {
      paid += Number(reg.amount) || 0;
    }

    const isExempt = reg.paymentStatus === 'exempt';
    const isDirect = reg.paymentStatus === 'direct_payment';

    return { pending, overdue, paid, refunded, cancelled, processing, isExempt, isDirect };
  };

  const getInstallmentProgress = (reg: SeasonRegistration): { paidInstallments: number; totalInstallments: number } => {
    const payments = (reg as any).payments || [];
    let paidInstallments = 0;
    let totalInstallments: number | undefined = undefined;

    for (const p of payments) {
      const status = String(p.status || '').toUpperCase();
      if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status)) {
        paidInstallments += 1;
      }
      const hinted = (p as any).installmentCount ?? (p as any)?.rawResponse?.installmentCount;
      if (typeof hinted === 'number' && hinted > 0) {
        totalInstallments = Math.max(totalInstallments || 0, hinted);
      }
    }

    if (totalInstallments === undefined) {
      if (payments.length > 0) totalInstallments = payments.length;
      else if (reg.paymentStatus === 'exempt' || reg.paymentStatus === 'direct_payment') {
        totalInstallments = 1;
        paidInstallments = 1;
      } else {
        totalInstallments = 1;
      }
    }

    const total = totalInstallments ?? 1;
    return { paidInstallments, totalInstallments: total };
  };

  const classifyRegistration = (reg: SeasonRegistration) => {
    const { pending, overdue, paid, refunded, cancelled, processing, isExempt, isDirect } = sumAmountsByStatus(reg);
    if (refunded > 0 || cancelled > 0) return 'refunded';
    if (overdue > 0) return 'overdue';
    if (pending > 0 || processing > 0) return 'pending';
    if (isDirect) return 'direct';
    if (isExempt) return 'exempt';
    if (paid > 0) return 'paid';
    return 'pending';
  };

  const seasonPendingOrOverdue = useMemo(() => {
    if (!selectedSeason) return [] as SeasonRegistration[];
    return registrations
      .filter((reg) => reg.inscriptionType === 'por_temporada')
      .filter((reg) => (reg.season?.id || reg.seasonId) === selectedSeason.id)
      .sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
  }, [selectedSeason, registrations]);

  const stagePendingOrOverdue = useMemo(() => {
    if (!selectedStage) return [] as SeasonRegistration[];
    return registrations
      .filter((reg) => {
        const seasonId = reg.season?.id || reg.seasonId;
        if (seasonId !== selectedStage.seasonId) return false;
        if (reg.inscriptionType === 'por_etapa') {
          const stages = (reg as any).stages || [];
          return stages.some((s: any) => (s.stage?.id || s.stageId) === selectedStage.id);
        }
        // por_temporada: não considerar em listagem por etapa
        return false;
      })
      .sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
  }, [selectedStage, registrations]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="w-full p-6">
          Carregando visão gerencial...
        </Card>
      </div>
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

  const overall = aggregatePayments(registrations);

  return (
    <div className="space-y-6">
      {/* KPIs gerais do campeonato */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(overall.paidAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(overall.pendingAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overall.overdueAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por temporada */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pagamentos por Temporada</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="md:hidden space-y-2">
            {seasonGroups.map((s) => (
              <button
                key={s.seasonId}
                onClick={() => { setSelectedStage(null); setSelectedSeason({ id: s.seasonId, name: s.seasonName }); setStatusFilter('all'); setSearchQuery(''); }}
                className="w-full text-left border rounded-lg p-4 bg-background hover:bg-muted/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.seasonName}</div>
                  <div className="text-xs text-muted-foreground">{s.totalRegistrations} inscrições</div>
                </div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Pago</div>
                    <div className="font-semibold text-green-600">{formatCurrency(s.paidAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pendente</div>
                    <div className="font-semibold text-yellow-600">{formatCurrency(s.pendingAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Vencido</div>
                    <div className="font-semibold text-red-600">{formatCurrency(s.overdueAmount)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Temporada</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead className="text-right">Vencido</TableHead>
                  <TableHead className="text-right">Inscrições</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasonGroups.map((s) => (
                  <TableRow key={s.seasonId} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedStage(null); setSelectedSeason({ id: s.seasonId, name: s.seasonName }); setStatusFilter('all'); }}>
                    <TableCell className="font-medium">{s.seasonName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.paidAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.pendingAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.overdueAmount)}</TableCell>
                    <TableCell className="text-right">{s.totalRegistrations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por etapa (agrupar por temporada) */}
      {stageGroups.map((group) => (
        <Card key={group.seasonId} className="w-full">
          <CardHeader>
            <CardTitle>Pagamentos por Etapa — {group.seasonName}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {group.stages.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4">Sem inscrições por etapa nesta temporada.</div>
            ) : (
              <>
                <div className="md:hidden space-y-2">
                  {group.stages.map((st, idx) => (
                    <button
                      key={`${group.seasonId}-${idx}`}
                      onClick={() => { setSelectedSeason(null); setSelectedStage({ id: st.stageId, seasonId: group.seasonId, stageName: st.stageName, seasonName: group.seasonName }); setStatusFilter('all'); setSearchQuery(''); }}
                      className="w-full text-left border rounded-lg p-4 bg-background hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{st.stageName}</div>
                        <div className="text-xs text-muted-foreground">{st.totalRegistrations} inscrições</div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Pago</div>
                          <div className="font-semibold text-green-600">{formatCurrency(st.paidAmount)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Pendente</div>
                          <div className="font-semibold text-yellow-600">{formatCurrency(st.pendingAmount)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Vencido</div>
                          <div className="font-semibold text-red-600">{formatCurrency(st.overdueAmount)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Etapa</TableHead>
                        <TableHead className="text-right">Pago</TableHead>
                        <TableHead className="text-right">Pendente</TableHead>
                        <TableHead className="text-right">Vencido</TableHead>
                        <TableHead className="text-right">Inscrições</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.stages.map((st, idx) => (
                        <TableRow key={`${group.seasonId}-${idx}`} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedSeason(null); setSelectedStage({ id: st.stageId, seasonId: group.seasonId, stageName: st.stageName, seasonName: group.seasonName }); setStatusFilter('all'); }}>
                          <TableCell className="font-medium">{st.stageName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(st.paidAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(st.pendingAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(st.overdueAmount)}</TableCell>
                          <TableCell className="text-right">{st.totalRegistrations}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Listagem de pilotos pendentes/vencidos por seleção */}
      {selectedSeason && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Pilotos — {selectedSeason.name}</CardTitle>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {filterOptions.map((opt) => (
                <Button
                  key={opt.key}
                  size="sm"
                  variant={statusFilter === opt.key ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="md:hidden space-y-2 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 rounded-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    className="shrink-0"
                    variant={statusFilter === opt.key ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="hidden md:block mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 rounded-full w-full max-w-md"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {(() => {
              const seasonList = seasonPendingOrOverdue
                .filter((reg) => statusFilter === 'all' ? true : classifyRegistration(reg) === statusFilter)
                .filter((reg) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const name = (reg.user?.name || '').toLowerCase();
                  const email = (reg.user?.email || '').toLowerCase();
                  return name.includes(q) || email.includes(q);
                });
              if (seasonList.length === 0) {
                return (
                  <div className="text-sm text-muted-foreground">
                    {statusFilter === 'all'
                      ? 'Nenhum piloto encontrado nesta temporada.'
                      : `Nenhum piloto com status "${statusLabel[statusFilter]}" nesta temporada.`}
                  </div>
                );
              }
              return (
              <div className="divide-y">
                {seasonList.map((reg) => {
                  const status = classifyRegistration(reg);
                  const { pending, overdue, paid, refunded, cancelled, processing, isExempt, isDirect } = sumAmountsByStatus(reg);
                  const { paidInstallments, totalInstallments } = getInstallmentProgress(reg);
                  const phone = (reg as any)?.user?.phone || (reg as any)?.user?.mobile || (reg as any)?.user?.telefone || (reg as any)?.user?.phoneNumber || (reg as any)?.profile?.phone;
                  const telHref = toTelHref(phone);
                  return (
                    <div key={reg.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{formatName(reg.user?.name || 'Piloto')}</div>
                        <div className="text-xs text-muted-foreground truncate">{reg.user?.email}</div>
                        {phone && telHref && (
                          <a href={telHref} className="text-xs text-muted-foreground truncate underline-offset-2 hover:underline">{formatPhoneBR(phone)}</a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        {status === 'refunded' && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Reembolsado</Badge>
                        )}
                        {status === 'overdue' && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>
                        )}
                        {status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
                        )}
                        {status === 'direct' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Pagamento Direto</Badge>
                        )}
                        {status === 'exempt' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Isento</Badge>
                        )}
                        {status === 'paid' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>
                        )}
                        <div className="text-right text-sm">
                          {!isExempt && totalInstallments > 1 && (
                            <div className="text-xs text-muted-foreground">{paidInstallments}/{totalInstallments} parcelas</div>
                          )}
                          {!isExempt && (
                            <>
                              {paid > 0 && <div className="text-green-700">{formatCurrency(paid)}</div>}
                              {overdue > 0 && <div className="text-red-600">{formatCurrency(overdue)}</div>}
                              {pending > 0 && <div className="text-yellow-700">{formatCurrency(pending)}</div>}
                              {processing > 0 && <div className="text-blue-700">{formatCurrency(processing)}</div>}
                              {refunded > 0 && <div className="text-purple-700">{formatCurrency(refunded)}</div>}
                              {cancelled > 0 && <div className="text-gray-700">{formatCurrency(cancelled)}</div>}
                            </>
                          )}
                        </div>
                        {(() => {
                          const canManagePayment = status === 'pending' || status === 'overdue';
                          if (!canManagePayment) return null;
                          return (
                            <div className="flex items-center gap-2 mt-2 justify-end w-full sm:w-auto">
                              {(() => {
                                const payments: any[] = (reg as any).payments || [];
                                const hasPix = payments.some((p) => p.pixCopyPaste);
                                return hasPix && (status === 'pending' || status === 'overdue') ? (
                                  <Button size="sm" variant="outline" onClick={() => handleCopyPix(reg)}>Copiar PIX</Button>
                                ) : null;
                              })()}
                              {(() => {
                                const p = findEligiblePayment(reg);
                                return p ? (
                                  <Button size="sm" variant="outline" onClick={() => openDueDateDialog(reg)}>Alterar Vencimento</Button>
                                ) : null;
                              })()}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {selectedStage && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Pilotos — {selectedStage.stageName} ({selectedStage.seasonName})</CardTitle>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {filterOptions.map((opt) => (
                <Button
                  key={opt.key}
                  size="sm"
                  variant={statusFilter === opt.key ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="md:hidden space-y-2 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 rounded-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    className="shrink-0"
                    variant={statusFilter === opt.key ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="hidden md:block mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 rounded-full w-full max-w-md"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {(() => {
              const stageList = stagePendingOrOverdue
                .filter((reg) => statusFilter === 'all' ? true : classifyRegistration(reg) === statusFilter)
                .filter((reg) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const name = (reg.user?.name || '').toLowerCase();
                  const email = (reg.user?.email || '').toLowerCase();
                  return name.includes(q) || email.includes(q);
                });
              if (stageList.length === 0) {
                return (
                  <div className="text-sm text-muted-foreground">
                    {statusFilter === 'all'
                      ? 'Nenhum piloto encontrado nesta etapa.'
                      : `Nenhum piloto com status "${statusLabel[statusFilter]}" nesta etapa.`}
                  </div>
                );
              }
              return (
              <div className="divide-y">
                {stageList.map((reg) => {
                  const status = classifyRegistration(reg);
                  const { pending, overdue, paid, refunded, cancelled, processing, isExempt, isDirect } = sumAmountsByStatus(reg);
                  const { paidInstallments, totalInstallments } = getInstallmentProgress(reg);
                  const phone = (reg as any)?.user?.phone || (reg as any)?.user?.mobile || (reg as any)?.user?.telefone || (reg as any)?.user?.phoneNumber || (reg as any)?.profile?.phone;
                  const telHref = toTelHref(phone);
                  return (
                    <div key={reg.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{formatName(reg.user?.name || 'Piloto')}</div>
                        <div className="text-xs text-muted-foreground truncate">{reg.user?.email}</div>
                        {phone && telHref && (
                          <a href={telHref} className="text-xs text-muted-foreground truncate underline-offset-2 hover:underline">{formatPhoneBR(phone)}</a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        {status === 'refunded' && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Reembolsado</Badge>
                        )}
                        {status === 'overdue' && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>
                        )}
                        {status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
                        )}
                        {status === 'direct' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Pagamento Direto</Badge>
                        )}
                        {status === 'exempt' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Isento</Badge>
                        )}
                        {status === 'paid' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>
                        )}
                        <div className="text-right text-sm">
                          {!isExempt && totalInstallments > 1 && (
                            <div className="text-xs text-muted-foreground">{paidInstallments}/{totalInstallments} parcelas</div>
                          )}
                          {!isExempt && (
                            <>
                              {paid > 0 && <div className="text-green-700">{formatCurrency(paid)}</div>}
                              {overdue > 0 && <div className="text-red-600">{formatCurrency(overdue)}</div>}
                              {pending > 0 && <div className="text-yellow-700">{formatCurrency(pending)}</div>}
                              {processing > 0 && <div className="text-blue-700">{formatCurrency(processing)}</div>}
                              {refunded > 0 && <div className="text-purple-700">{formatCurrency(refunded)}</div>}
                              {cancelled > 0 && <div className="text-gray-700">{formatCurrency(cancelled)}</div>}
                            </>
                          )}
                        </div>
                        {(() => {
                          const canManagePayment = status === 'pending' || status === 'overdue';
                          if (!canManagePayment) return null;
                          return (
                            <div className="flex items-center gap-2 mt-2 justify-end w-full sm:w-auto">
                              {(() => {
                                const payments: any[] = (reg as any).payments || [];
                                const hasPix = payments.some((p) => p.pixCopyPaste);
                                return hasPix && (status === 'pending' || status === 'overdue') ? (
                                  <Button size="sm" variant="outline" onClick={() => handleCopyPix(reg)}>Copiar PIX</Button>
                                ) : null;
                              })()}
                              {(() => {
                                const p = findEligiblePayment(reg);
                                return p ? (
                                  <Button size="sm" variant="outline" onClick={() => openDueDateDialog(reg)}>Alterar Vencimento</Button>
                                ) : null;
                              })()}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Dialog de atualização de vencimento */}
      <Dialog open={dueDateDialogOpen} onOpenChange={setDueDateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Atualizar Vencimento</DialogTitle>
            <DialogDescription>
              Defina uma nova data de vencimento para gerar um novo QR Code (quando aplicável).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPaymentInfo && (
              <div className="border rounded-lg p-4 bg-muted/50 text-sm">
                <div><span className="text-muted-foreground">Piloto:</span> <span className="font-semibold">{selectedPaymentInfo.pilot}</span></div>
                <div><span className="text-muted-foreground">Valor:</span> <span className="font-semibold">{formatCurrency(selectedPaymentInfo.value || 0)}</span></div>
                <div><span className="text-muted-foreground">Vencimento Atual:</span> <span className="font-semibold">{selectedPaymentInfo.dueDate}</span></div>
              </div>
            )}
            <div className="space-y-2">
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              <p className="text-xs text-muted-foreground">A nova data deve ser posterior à data atual.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDueDateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmUpdateDueDate} disabled={!newDueDate}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


