import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "brk-design-system";
import { Phone, Search, User2, Wallet, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Loading } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { SeasonRegistration, SeasonRegistrationService } from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";
import { formatName } from "@/utils/name";
import { toast } from "sonner";

interface PilotsTabProps {
  championshipId: string;
}

// Utilitário local para mascarar telefone brasileiro
const formatPhoneBR = (raw?: string) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 10) return raw;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length >= 9) {
    const first = rest.slice(0, 5);
    const last = rest.slice(5, 9);
    return `(${ddd}) ${first}-${last}`;
  }
  const first = rest.slice(0, 4);
  const last = rest.slice(4, 8);
  return `(${ddd}) ${first}-${last}`;
};

const toTelHref = (raw?: string) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  return `tel:${digits}`;
};

// Link WhatsApp a partir de um telefone bruto
const toWhatsAppHref = (raw?: string) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  // Se não tiver DDI, assume Brasil (55)
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
};

type PilotFinancial = {
  paid: number;
  pending: number;
  overdue: number;
  paidInstallments: number;
  totalInstallments: number;
};

type PilotCard = {
  userId: string;
  name: string;
  nickname?: string | null;
  phone?: string;
  categories: string[];
  financial: PilotFinancial;
  status: {
    overdue: boolean;
    pending: boolean;
    paid: boolean;
    direct: boolean;
    exempt: boolean;
    refunded: boolean;
    cancelled: boolean;
  };
  inscription: {
    bySeason: boolean;
    stages: { id: string; name: string; date?: string }[];
  };
};

const computeFinancial = (regs: SeasonRegistration[]): PilotFinancial => {
  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let paidInstallments = 0;
  let totalInstallments = 0;

  for (const reg of regs) {
    const payments = (reg as any).payments || [];
    if (Array.isArray(payments) && payments.length > 0) {
      totalInstallments += payments.length;
      for (const p of payments) {
        const status = String(p.status || "").toUpperCase();
        const value = Number(p.value) || 0;
        if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(status)) {
          paid += value;
          paidInstallments += 1;
        } else if (status === "OVERDUE") {
          overdue += value;
        } else if (["PENDING", "AWAITING_PAYMENT", "AWAITING_RISK_ANALYSIS"].includes(status)) {
          pending += value;
        }
      }
    } else {
      // Inscrições administrativas sem pagamentos
      if (reg.paymentStatus === "exempt" || reg.paymentStatus === "direct_payment" || reg.paymentStatus === "paid") {
        paid += Number(reg.amount) || 0;
        totalInstallments += 1;
        paidInstallments += 1;
      }
    }
  }

  return { paid, pending, overdue, paidInstallments, totalInstallments };
};

const getPhoneFromRegistration = (reg?: SeasonRegistration) => {
  if (!reg) return undefined;
  const u: any = (reg as any).user || {};
  const profile: any = (reg as any).profile || {};
  return u.phone || u.mobile || u.telefone || u.phoneNumber || profile.phone;
};

const getNicknameFromRegistration = (reg?: SeasonRegistration) => {
  if (!reg) return undefined;
  const u: any = (reg as any).user || {};
  return u.nickname || u.nickName || null;
};

const computeStatusFlags = (regs: SeasonRegistration[]) => {
  let overdue = false;
  let pending = false;
  let paid = false;
  let direct = false;
  let exempt = false;
  let refunded = false;
  let cancelled = false;

  for (const reg of regs) {
    const payments = (reg as any).payments || [];
    if (Array.isArray(payments) && payments.length > 0) {
      for (const p of payments) {
        const status = String(p.status || "").toUpperCase();
        if (status === "OVERDUE") overdue = true;
        else if (status === "PENDING" || status === "AWAITING_PAYMENT" || status === "AWAITING_RISK_ANALYSIS") pending = true;
        else if (status === "REFUNDED") refunded = true;
        else if (status === "CANCELLED") cancelled = true;
        else if (status === "RECEIVED" || status === "CONFIRMED" || status === "RECEIVED_IN_CASH") paid = true;
      }
    }
    if (reg.paymentStatus === "exempt") {
      exempt = true;
      paid = true; // considerar como quitado
    }
    if (reg.paymentStatus === "direct_payment") {
      direct = true;
      paid = true; // considerar como quitado
    }
    if (reg.paymentStatus === "paid") {
      paid = true;
    }
  }

  return { overdue, pending, paid, direct, exempt, refunded, cancelled };
};

export const PilotsTab = ({ championshipId }: PilotsTabProps) => {
  const { getRegistrations, getCategories, getSeasons, updateRegistration, loading, error } = useChampionshipData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue" | "exempt">("all");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [inscriptionFilter, setInscriptionFilter] = useState<"all" | "season" | "stage">("all");

  // Dados brutos do contexto
  const registrations = getRegistrations();

  // Agregar por usuário
  const pilots: PilotCard[] = useMemo(() => {
    const byUser = new Map<string, SeasonRegistration[]>();
    for (const reg of registrations) {
      const uid = reg.userId || (reg as any).user?.id;
      if (!uid) continue;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(reg);
    }

    const list: PilotCard[] = [];
    for (const [userId, regs] of byUser.entries()) {
      const first = regs[0];
      const user: any = (first as any).user || {};
      const name = user.name || userId;
      const nickname = getNicknameFromRegistration(first);
      const phone = getPhoneFromRegistration(first);
      const categoriesSet = new Set<string>();
      for (const r of regs) {
        const cats: any[] = (r as any).categories || [];
        for (const c of cats) {
          const label = c?.category?.name || c?.name || c?.categoryName || c?.category_id || "Categoria";
          categoriesSet.add(String(label));
        }
      }

      const financial = computeFinancial(regs);
      const status = computeStatusFlags(regs);

      // Inscrição por temporada/etapa
      let bySeason = false;
      const stagesMap = new Map<string, { id: string; name: string; date?: string }>();
      for (const r of regs) {
        if ((r as any).inscriptionType === "por_temporada") {
          bySeason = true;
        }
        if ((r as any).inscriptionType === "por_etapa") {
          const regStages: any[] = (r as any).stages || [];
          for (const s of regStages) {
            const sid = s?.stage?.id || s?.stageId;
            if (!sid) continue;
            if (!stagesMap.has(String(sid))) {
              stagesMap.set(String(sid), {
                id: String(sid),
                name: s?.stage?.name || s?.name || "Etapa",
                date: s?.stage?.date || s?.date,
              });
            }
          }
        }
      }
      const stages = Array.from(stagesMap.values()).sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      });

      list.push({
        userId,
        name,
        nickname,
        phone,
        categories: Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
        financial,
        status,
        inscription: { bySeason, stages },
      });
    }

    // Ordenar por nome
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [registrations]);

  // Filtro de busca e status
  const filteredPilots = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pilots.filter((p) => {
      const matchesSearch = !term
        || p.name.toLowerCase().includes(term)
        || (p.nickname && p.nickname.toLowerCase().includes(term))
        || p.categories.some((c) => c.toLowerCase().includes(term));

      let matchesStatus = true;
      if (statusFilter === "paid") {
        // Considerar pagos diretos também como pagos
        matchesStatus = (p.financial.overdue === 0 && p.financial.pending === 0 && p.financial.paid > 0) || p.status.direct === true;
      } else if (statusFilter === "pending") {
        matchesStatus = p.financial.overdue === 0 && p.financial.pending > 0;
      } else if (statusFilter === "overdue") {
        matchesStatus = p.financial.overdue > 0;
      } else if (statusFilter === "exempt") {
        matchesStatus = p.status.exempt === true;
      }

      // Filtro por temporada e categoria (usa inscrições originais)
      const regsForPilot = registrations.filter((r) => (r.userId || (r as any).user?.id) === p.userId);
      const matchesSeason = !selectedSeasonId
        ? true
        : regsForPilot.some((r) => (r.season?.id || (r as any).seasonId) === selectedSeasonId);

      let matchesCategory = true;
      if (selectedCategoryId) {
        if (selectedSeasonId) {
          matchesCategory = regsForPilot.some((r) => {
            const sid = r.season?.id || (r as any).seasonId;
            if (sid !== selectedSeasonId) return false;
            const cats: any[] = (r as any).categories || [];
            return cats.some((c) => String(c?.category?.id || c?.categoryId || c?.id) === selectedCategoryId);
          });
        } else {
          matchesCategory = regsForPilot.some((r) => {
            const cats: any[] = (r as any).categories || [];
            return cats.some((c) => String(c?.category?.id || c?.categoryId || c?.id) === selectedCategoryId);
          });
        }
      }

      // Filtro por tipo de inscrição
      let matchesInscription = true;
      if (inscriptionFilter === "season") {
        matchesInscription = p.inscription.bySeason === true;
      } else if (inscriptionFilter === "stage") {
        matchesInscription = (p.inscription.stages?.length || 0) > 0;
      }

      return matchesSearch && matchesStatus && matchesSeason && matchesCategory && matchesInscription;
    });
  }, [pilots, search, statusFilter, registrations, selectedSeasonId, selectedCategoryId, inscriptionFilter]);

  // --- Modal de edição de categorias ---
  const [editOpen, setEditOpen] = useState(false);
  const [editingPilot, setEditingPilot] = useState<PilotCard | null>(null);
  const [seasonCategorySelection, setSeasonCategorySelection] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState(false);

  const allCategories = getCategories();
  const seasons = getSeasons();

  const openEditCategories = (pilot: PilotCard) => {
    // Construir seleção por temporada a partir das inscrições do piloto
    const regsBySeason = registrations.filter((r) => (r.userId || (r as any).user?.id) === pilot.userId);
    const initial: Record<string, Set<string>> = {};
    for (const reg of regsBySeason) {
      const seasonId = reg.season?.id || reg.seasonId;
      if (!seasonId) continue;
      const cats: any[] = (reg as any).categories || [];
      const selected = new Set<string>();
      for (const c of cats) {
        const id = c?.category?.id || c?.categoryId || c?.id;
        if (id) selected.add(String(id));
      }
      initial[seasonId] = selected;
    }
    setSeasonCategorySelection(initial);
    setEditingPilot(pilot);
    setEditOpen(true);
  };

  const toggleCategory = (seasonId: string, categoryId: string, checked: boolean) => {
    setSeasonCategorySelection((prev) => {
      const next = { ...prev };
      const set = new Set<string>(next[seasonId] ? Array.from(next[seasonId]) : []);
      if (checked) set.add(categoryId);
      else set.delete(categoryId);
      next[seasonId] = set;
      return next;
    });
  };

  const onSaveCategories = async () => {
    if (!editingPilot) return;
    try {
      setSaving(true);
      const regsBySeason = registrations.filter((r) => (r.userId || (r as any).user?.id) === editingPilot.userId);
      for (const reg of regsBySeason) {
        const seasonId = reg.season?.id || reg.seasonId;
        if (!seasonId) continue;
        const selectedIds = Array.from(seasonCategorySelection[seasonId] || new Set<string>());
        // Obter categorias atuais para comparar
        const currentCats: any[] = (reg as any).categories || [];
        const currentIds = currentCats
          .map((c) => c?.category?.id || c?.categoryId || c?.id)
          .filter(Boolean)
          .map(String);
        const changed = selectedIds.sort().join(",") !== currentIds.sort().join(",");
        if (!changed) continue;

        const paymentStatus = (reg.paymentStatus === "exempt" || reg.paymentStatus === "direct_payment")
          ? reg.paymentStatus
          : "direct_payment"; // fallback seguro
        const amount = Number(reg.amount) || 0;

        const { registration } = await SeasonRegistrationService.createAdminRegistration({
          userId: editingPilot.userId,
          seasonId: seasonId,
          categoryIds: selectedIds,
          paymentStatus: paymentStatus as any,
          amount,
        });

        // Atualizar contexto
        if (registration?.id) {
          updateRegistration(registration.id, registration as any);
        }
      }
      toast.success("Categorias atualizadas com sucesso");
      setEditOpen(false);
      setEditingPilot(null);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar categorias");
    } finally {
      setSaving(false);
    }
  };

  const renderStatusBadge = (f: PilotFinancial) => {
    if (f.overdue > 0) return <Badge variant="destructive">Em atraso</Badge>;
    if (f.pending > 0) return <Badge variant="secondary">Pendente</Badge>;
    if (f.paid > 0) return <Badge variant="default">Pago</Badge>;
    return <Badge variant="outline">Sem cobrança</Badge>;
  };

  if (loading.registrations) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading type="spinner" size="sm" message="Carregando pilotos..." />
      </div>
    );
  }

  if (error.registrations) {
    return (
      <Alert>
        <AlertDescription>{error.registrations}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">Busca</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, apelido ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <div className="text-xs text-muted-foreground mb-1">Filtros financeiros</div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-2 text-sm rounded-md border w-full sm:w-auto ${statusFilter === "all" ? "bg-primary text-white border-primary" : "bg-background"}`}
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </button>
            <button
              className={`px-3 py-2 text-sm rounded-md border w-full sm:w-auto ${statusFilter === "paid" ? "bg-primary text-white border-primary" : "bg-background"}`}
              onClick={() => setStatusFilter("paid")}
            >
              Pagos
            </button>
            <button
              className={`px-3 py-2 text-sm rounded-md border w-full sm:w-auto ${statusFilter === "pending" ? "bg-primary text-white border-primary" : "bg-background"}`}
              onClick={() => setStatusFilter("pending")}
            >
              Pendentes
            </button>
            <button
              className={`px-3 py-2 text-sm rounded-md border w-full sm:w-auto ${statusFilter === "overdue" ? "bg-primary text-white border-primary" : "bg-background"}`}
              onClick={() => setStatusFilter("overdue")}
            >
              Em atraso
            </button>
            <button
              className={`px-3 py-2 text-sm rounded-md border w-full sm:w-auto ${statusFilter === "exempt" ? "bg-primary text-white border-primary" : "bg-background"}`}
              onClick={() => setStatusFilter("exempt")}
            >
              Isentos
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="w-full sm:w-auto">
          <div className="text-xs text-muted-foreground mb-1">Temporada</div>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="w-full sm:w-56 bg-background border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todas as temporadas</option>
            {seasons.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <div className="text-xs text-muted-foreground mb-1">Categoria</div>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full sm:w-56 bg-background border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todas as categorias</option>
            {(() => {
              const seasonId = selectedSeasonId;
              const cats = allCategories.filter((c) => !seasonId || c.seasonId === seasonId);
              return cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ));
            })()}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <div className="text-xs text-muted-foreground mb-1">Tipo de inscrição</div>
          <select
            value={inscriptionFilter}
            onChange={(e) => setInscriptionFilter(e.target.value as any)}
            className="w-full sm:w-56 bg-background border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Todos os tipos</option>
            <option value="season">Por temporada</option>
            <option value="stage">Por etapa</option>
          </select>
        </div>
      </div>

      {/* Grid de pilotos */}
      {filteredPilots.length === 0 ? (
        <Alert>
          <AlertDescription>
            Nenhum piloto encontrado {search ? "para a busca aplicada." : "no campeonato."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPilots.map((p) => {
            const tel = toTelHref(p.phone);
            const hasPhone = Boolean(tel);
            return (
              <Card key={p.userId} className="w-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <User2 className="h-5 w-5 text-muted-foreground" />
                      <div className="truncate">
                        <div className="font-semibold truncate text-sm sm:text-base">{formatName(p.name)}</div>
                        {p.nickname && (
                          <div className="text-xs text-muted-foreground truncate">@{p.nickname}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Regras de cor seguindo FinancialTab */}
                      {p.status.refunded && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 hover:text-purple-800 hover:border-purple-800 hover:border-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                          Reembolsado
                        </Badge>
                      )}
                      {p.status.overdue && !p.status.refunded && (
                        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 hover:text-red-800 hover:border-red-800 hover:border-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                          Vencido
                        </Badge>
                      )}
                      {p.status.pending && !p.status.overdue && !p.status.refunded && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-800 hover:border-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                          Pendente
                        </Badge>
                      )}
                      {p.status.direct && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-800 hover:border-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                          Pagamento Direto
                        </Badge>
                      )}
                      {p.status.exempt && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-800 hover:border-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                          Isento
                        </Badge>
                      )}
                      {!p.status.overdue && !p.status.pending && p.status.paid && !p.status.refunded && !p.status.cancelled && !p.status.direct && !p.status.exempt && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-800 hover:border-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                          Pago
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        {p.financial.paid > 0 && (
                          <div>
                            <span className="text-muted-foreground">Pago:</span>{" "}
                            <span className="font-medium text-green-700">{formatCurrency(p.financial.paid)}</span>
                          </div>
                        )}
                        {p.financial.pending > 0 && (
                          <div>
                            <span className="text-muted-foreground">Pendente:</span>{" "}
                            <span className="font-medium text-yellow-700">{formatCurrency(p.financial.pending)}</span>
                          </div>
                        )}
                        {p.financial.overdue > 0 && (
                          <div>
                            <span className="text-muted-foreground">Em atraso:</span>{" "}
                            <span className="font-medium text-red-600">{formatCurrency(p.financial.overdue)}</span>
                          </div>
                        )}
                        {p.financial.totalInstallments > 1 && (
                          <div className="text-xs text-muted-foreground">
                            Parcelas: {p.financial.paidInstallments}/{p.financial.totalInstallments}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Inscrição</div>
                      <div className="flex flex-wrap gap-1">
                        {p.inscription.bySeason && (
                          <Badge variant="outline" className="text-xs">Por Temporada</Badge>
                        )}
                        {p.inscription.stages.length > 0 && (
                          <Badge variant="outline" className="text-xs">Por Etapa</Badge>
                        )}
                      </div>
                      {p.inscription.stages.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.inscription.stages.map((st) => (
                            <Badge key={st.id} variant="secondary" className="text-xs">
                              {st.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {(() => {
                        const wa = toWhatsAppHref(p.phone);
                        return wa ? (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                            {formatPhoneBR(p.phone)}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Telefone não informado</span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col gap-2">
                      {p.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.categories.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div>
                        <Button variant="outline" size="sm" onClick={() => openEditCategories(p)} className="inline-flex items-center gap-2">
                          <Settings2 className="h-4 w-4" />
                          Editar categorias
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de edição de categorias */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Editar categorias</DialogTitle>
            <DialogDescription>
              Selecione as categorias por temporada para {editingPilot ? formatName(editingPilot.name) : "o piloto"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {editingPilot ? (
              (() => {
                const regsBySeason = registrations.filter((r) => (r.userId || (r as any).user?.id) === editingPilot.userId);
                if (regsBySeason.length === 0) {
                  return (
                    <Alert>
                      <AlertDescription>Este piloto não possui inscrições neste campeonato.</AlertDescription>
                    </Alert>
                  );
                }
                return (
                  <div className="space-y-4">
                    {regsBySeason.map((reg) => {
                      const seasonId = reg.season?.id || reg.seasonId;
                      const seasonName = seasons.find((s: any) => s.id === seasonId)?.name || "Temporada";
                      const options = allCategories.filter((c) => c.seasonId === seasonId);
                      const selected = seasonCategorySelection[seasonId] || new Set<string>();
                      return (
                        <div key={seasonId} className="border rounded-lg p-4">
                          <div className="font-medium mb-3">{seasonName}</div>
                          {options.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Sem categorias disponíveis para esta temporada.</div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {options.map((cat) => (
                                <label key={cat.id} className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={selected.has(cat.id)}
                                    onCheckedChange={(checked) => toggleCategory(seasonId, cat.id, Boolean(checked))}
                                  />
                                  <span>{cat.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={onSaveCategories} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


