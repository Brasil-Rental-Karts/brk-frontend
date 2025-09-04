import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from "brk-design-system";
import {
  Award,
  ChevronDown,
  CreditCard,
  LayoutGrid,
  Settings,
  Trophy,
  Users,
  ListOrdered,
  FileText,
  FlagTriangleRight,
  Gauge,
  BarChart3,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { FC } from "react";
import { useEffect, useState } from "react";

import { UserPermissions } from "@/hooks/use-staff-permissions";
import { Championship } from "@/lib/services/championship.service";

export interface ChampionshipHeaderProps {
  championship: Championship;
  permissions?: UserPermissions & { analise?: boolean; dashboard?: boolean };
}

/**
 * Header da página do campeonato
 * Exibe avatar, nome, link para página pública e botão de configurações com dropdown
 */
export const ChampionshipHeader: FC<ChampionshipHeaderProps> = ({
  championship,
  permissions,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow || "";
    }
    return () => {
      document.body.style.overflow = originalOverflow || "";
    };
  }, [mobileMenuOpen]);

  const handleViewPublicPage = () => {
    const siteUrl = import.meta.env.VITE_SITE_URL;
    window.location.href = `${siteUrl}/campeonato/${championship.slug}`;
  };

  const handleConfigurationOption = (
    option:
      | "grid-types"
      | "scoring-systems"
      | "asaas-account"
      | "edit-data"
      | "sponsors"
      | "staff",
  ) => {
    if (option === "edit-data") {
      navigate(`/championship/${championship.id}/edit`);
    } else {
      navigate(`/championship/${championship.id}?tab=${option}`);
    }
  };

  const handleNavigate = (tab: string) => {
    navigate(`/championship/${championship.id}?tab=${tab}`);
  };

  // Derivar estado ativo e disponibilidade com base nos dados
  const tabMapping: { [key: string]: string } = {
    dashboard: "dashboard",
    painel: "dashboard",
    seasons: "temporadas",
    temporadas: "temporadas",
    categories: "categorias",
    categorias: "categorias",
    stages: "etapas",
    etapas: "etapas",
    classification: "classificacao",
    classificacao: "classificacao",
    regulations: "regulamento",
    regulamento: "regulamento",
    penalties: "penalties",
    "race-day": "race-day",
    "edit-data": "config-edit",
    "config-edit": "config-edit",
    sponsors: "config-sponsors",
    "config-sponsors": "config-sponsors",
    staff: "config-staff",
    "config-staff": "config-staff",
    "grid-types": "config-grid",
    "config-grid": "config-grid",
    "scoring-systems": "config-scoring",
    "config-scoring": "config-scoring",
    "asaas-account": "config-asaas",
    "config-asaas": "config-asaas",
    analise: "analises",
    analises: "analises",
  };
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl ? tabMapping[tabFromUrl] ?? tabFromUrl : "temporadas";
  const hasSeasons = !!championship?.seasons?.length;
  const hasCategories = hasSeasons && (championship.seasons as any[]).some((s: any) => s?.categories?.length > 0);

  // Gerar iniciais do nome do campeonato para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-dark-900 text-white w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="container px-6 py-4">
        {/* Layout Desktop */}
        <div className="hidden md:flex items-center justify-between">
          {/* Avatar e nome */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white/20">
              {championship.championshipImage ? (
                <AvatarImage
                  src={championship.championshipImage}
                  alt={`Avatar ${championship.name}`}
                />
              ) : (
                <AvatarImage
                  src={`/api/championships/${championship.id}/avatar`}
                  alt={`Avatar ${championship.name}`}
                />
              )}
              <AvatarFallback className="text-sm font-bold text-black bg-white">
                {getInitials(championship.name)}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-2xl font-bold">{championship.name}</h1>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewPublicPage}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent"
            >
              Visitar Página
            </Button>
            {/* No desktop, a navegação por contexto fica abaixo do header. */}
          </div>
        </div>

        {/* Layout Mobile */}
        <div className="md:hidden space-y-4">
          {/* Linha 1: Avatar e nome */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage
                src={`/api/championships/${championship.id}/avatar`}
                alt={`Avatar ${championship.name}`}
              />
              <AvatarFallback className="text-xs font-bold text-black bg-white">
                {getInitials(championship.name)}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-lg font-bold flex-1 min-w-0">
              <span className="truncate block">{championship.name}</span>
            </h1>
          </div>

          {/* Linha 2: Botões + Dropdown mobile */}
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewPublicPage}
              className="flex-1 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent text-xs"
            >
              Visitar Página
            </Button>

            {/* Menu mobile full-screen focado em usabilidade */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="flex-1 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent text-xs"
            >
              <span className="truncate mr-1">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "temporadas" && "Temporadas"}
                {activeTab === "categorias" && "Categorias"}
                {activeTab === "etapas" && "Etapas"}
                {activeTab === "classificacao" && "Classificação"}
                {activeTab === "regulamento" && "Regulamento"}
                {activeTab === "penalties" && "Punições"}
                {activeTab === "race-day" && "Race Day"}
                {activeTab === "analises" && "Análises"}
                {activeTab === "config-edit" && "Editar Campeonato"}
                {activeTab === "config-grid" && "Tipos de Grid"}
                {activeTab === "config-scoring" && "Sistemas de Pontuação"}
                {activeTab === "config-sponsors" && "Patrocinadores"}
                {activeTab === "config-staff" && "Equipe"}
                {activeTab === "config-asaas" && "Conta Asaas"}
              </span>
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-[90] bg-black text-white overflow-y-auto">
                <div className="sticky top-0 z-[91] bg-black/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
                  <span className="text-sm text-white/70">Navegação</span>
                  <button onClick={() => setMobileMenuOpen(false)} aria-label="Fechar" className="p-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  {permissions?.dashboard && (
                    <div>
                      <div className="text-white/70 text-xs uppercase tracking-wide mb-2">Visão Geral</div>
                      <button onClick={() => { handleNavigate("dashboard"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                        <span className="inline-flex items-center gap-2"><Gauge className="h-5 w-5" /> Dashboard</span>
                      </button>
                    </div>
                  )}
                  {(permissions?.seasons || permissions?.categories || permissions?.stages) && (
                    <div>
                      <div className="text-white/70 text-xs uppercase tracking-wide mb-2">Organização</div>
                      {permissions?.seasons && (
                        <button onClick={() => { handleNavigate("temporadas"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><ListOrdered className="h-5 w-5" /> Temporadas</span>
                        </button>
                      )}
                      {permissions?.categories && (
                        <button disabled={!hasSeasons} onClick={() => { handleNavigate("categorias"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="inline-flex items-center gap-2"><LayoutGrid className="h-5 w-5" /> Categorias</span>
                        </button>
                      )}
                      {permissions?.stages && (
                        <button disabled={!hasCategories} onClick={() => { handleNavigate("etapas"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="inline-flex items-center gap-2"><FlagTriangleRight className="h-5 w-5" /> Etapas</span>
                        </button>
                      )}
                      {permissions?.regulations && (
                        <button disabled={!hasSeasons} onClick={() => { handleNavigate("regulamento"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="inline-flex items-center gap-2"><FileText className="h-5 w-5" /> Regulamento</span>
                        </button>
                      )}
                    </div>
                  )}
                  {(permissions?.classification || permissions?.raceDay || permissions?.penalties || permissions?.analise || permissions?.regulations) && (
                    <div>
                      <div className="text-white/70 text-xs uppercase tracking-wide mb-2">Desempenho</div>
                      {permissions?.classification && (
                        <button disabled={!hasSeasons} onClick={() => { handleNavigate("classificacao"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="inline-flex items-center gap-2"><Trophy className="h-5 w-5" /> Classificação</span>
                        </button>
                      )}
                      {permissions?.raceDay && (
                        <button disabled={!hasSeasons} onClick={() => { handleNavigate("race-day"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="inline-flex items-center gap-2"><FlagTriangleRight className="h-5 w-5" /> Race Day</span>
                        </button>
                      )}
                      {permissions?.penalties && (
                        <button disabled={!hasSeasons} onClick={() => { handleNavigate("penalties"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                          <span className="inline-flex items-center gap-2"><FileText className="h-5 w-5" /> Punições</span>
                        </button>
                      )}
                      {permissions?.analise && (
                        <button onClick={() => { handleNavigate("analises"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Análises</span>
                        </button>
                      )}
                    </div>
                  )}
                  {(permissions?.editChampionship || permissions?.gridTypes || permissions?.scoringSystems || permissions?.sponsors || permissions?.staff || permissions?.asaasAccount) && (
                    <div>
                      <div className="text-white/70 text-xs uppercase tracking-wide mb-2">Configurações</div>
                      {permissions?.editChampionship && (
                        <button onClick={() => { handleNavigate("config-edit"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><Settings className="h-5 w-5" /> Editar Campeonato</span>
                        </button>
                      )}
                      {permissions?.gridTypes && (
                        <button onClick={() => { handleNavigate("config-grid"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><LayoutGrid className="h-5 w-5" /> Tipos de Grid</span>
                        </button>
                      )}
                      {permissions?.scoringSystems && (
                        <button onClick={() => { handleNavigate("config-scoring"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><Trophy className="h-5 w-5" /> Sistemas de Pontuação</span>
                        </button>
                      )}
                      {permissions?.sponsors && (
                        <button onClick={() => { handleNavigate("config-sponsors"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><Award className="h-5 w-5" /> Patrocinadores</span>
                        </button>
                      )}
                      {permissions?.staff && (
                        <button onClick={() => { handleNavigate("config-staff"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><Users className="h-5 w-5" /> Equipe</span>
                        </button>
                      )}
                      {permissions?.asaasAccount && (
                        <button onClick={() => { handleNavigate("config-asaas"); setMobileMenuOpen(false); }} className="w-full text-left py-4 text-lg hover:text-primary">
                          <span className="inline-flex items-center gap-2"><CreditCard className="h-5 w-5" /> Conta Asaas</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
