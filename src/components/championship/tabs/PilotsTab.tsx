import {
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "brk-design-system";
import { Phone, Search, User2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Loading } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { SeasonRegistration } from "@/lib/services/season-registration.service";
import { formatCurrency } from "@/utils/currency";
import { formatName } from "@/utils/name";

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
  const { getRegistrations, loading, error } = useChampionshipData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue" | "exempt">("all");

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

      list.push({
        userId,
        name,
        nickname,
        phone,
        categories: Array.from(categoriesSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
        financial,
        status,
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

      return matchesSearch && matchesStatus;
    });
  }, [pilots, search, statusFilter]);

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
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-2 text-sm rounded-md border ${statusFilter === "all" ? "bg-primary text-white border-primary" : "bg-background"}`}
            onClick={() => setStatusFilter("all")}
          >
            Todos
          </button>
          <button
            className={`px-3 py-2 text-sm rounded-md border ${statusFilter === "paid" ? "bg-primary text-white border-primary" : "bg-background"}`}
            onClick={() => setStatusFilter("paid")}
          >
            Pagos
          </button>
          <button
            className={`px-3 py-2 text-sm rounded-md border ${statusFilter === "pending" ? "bg-primary text-white border-primary" : "bg-background"}`}
            onClick={() => setStatusFilter("pending")}
          >
            Pendentes
          </button>
          <button
            className={`px-3 py-2 text-sm rounded-md border ${statusFilter === "overdue" ? "bg-primary text-white border-primary" : "bg-background"}`}
            onClick={() => setStatusFilter("overdue")}
          >
            Em atraso
          </button>
          <button
            className={`px-3 py-2 text-sm rounded-md border ${statusFilter === "exempt" ? "bg-primary text-white border-primary" : "bg-background"}`}
            onClick={() => setStatusFilter("exempt")}
          >
            Isentos
          </button>
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
                        <div className="font-semibold truncate">{formatName(p.name)}</div>
                        {p.nickname && (
                          <div className="text-xs text-muted-foreground truncate">@{p.nickname}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Regras de cor seguindo FinancialTab */}
                      {p.status.refunded && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-800 hover:text-white">
                          Reembolsado
                        </Badge>
                      )}
                      {p.status.overdue && !p.status.refunded && (
                        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-800 hover:text-white">
                          Vencido
                        </Badge>
                      )}
                      {p.status.pending && !p.status.overdue && !p.status.refunded && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-800 hover:text-white">
                          Pendente
                        </Badge>
                      )}
                      {p.status.direct && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-800 hover:text-white">
                          Pagamento Direto
                        </Badge>
                      )}
                      {p.status.exempt && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-800 hover:text-white">
                          Isento
                        </Badge>
                      )}
                      {!p.status.overdue && !p.status.pending && p.status.paid && !p.status.refunded && !p.status.cancelled && !p.status.direct && !p.status.exempt && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-800 hover:text-white">
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
                    {p.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.categories.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};


