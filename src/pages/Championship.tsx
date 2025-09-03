import {
  Alert,
  AlertDescription,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "brk-design-system";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { ChampionshipHeader } from "@/components/championship/ChampionshipHeader";
import { AsaasAccountTab } from "@/components/championship/settings/AsaasAccountTab";
import { GridTypesTab } from "@/components/championship/settings/GridTypesTab";
import { ScoringSystemTab } from "@/components/championship/settings/ScoringSystemTab";
import { SponsorsTab } from "@/components/championship/settings/SponsorsTab";
import { StaffTab } from "@/components/championship/settings/StaffTab";
import { CategoriesTab } from "@/components/championship/tabs/CategoriesTab";
import { ClassificationTab } from "@/components/championship/tabs/ClassificationTab";
import { PenaltiesTab } from "@/components/championship/tabs/PenaltiesTab";
import { RaceDayTab } from "@/components/championship/tabs/RaceDayTab";
import { RegulationTab } from "@/components/championship/tabs/RegulationTab";
import { SeasonsTab } from "@/components/championship/tabs/SeasonsTab";
import { StagesTab } from "@/components/championship/tabs/StagesTab";
import { Loading } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  UserPermissions,
  useStaffPermissions,
} from "@/hooks/use-staff-permissions";
import { Category } from "@/lib/services/category.service";
import { Season as BaseSeason } from "@/lib/services/season.service";
import { Stage } from "@/lib/types/stage";
import CreateChampionship from "@/pages/CreateChampionship";
import { LapTimesChart } from "@/pages/LapTimesChart";

// Estende a interface base da temporada para incluir as categorias
type Season = BaseSeason & { categories?: Category[]; stages?: Stage[] };

/**
 * Página principal do campeonato
 * Exibe as informações detalhadas de um campeonato específico
 * com tabs para temporadas, categorias e configurações
 */
export const Championship = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("temporadas");
  const [classificationLoading, setClassificationLoading] = useState(false);
  const isMobile = useIsMobile();

  // Usar o contexto de dados do campeonato
  const {
    setChampionshipId,
    getChampionshipInfo,
    getSeasons,
    refreshClassification,
    fetchClassification,
    loading: contextLoading,
    error: contextError,
  } = useChampionshipData();

  // Usar o hook de permissões de staff que encontra o usuário atual corretamente
  type UserPermissionsWithAnalise = UserPermissions & { analise?: boolean };
  type UseStaffPermissionsReturn = {
    permissions: UserPermissionsWithAnalise;
    loading: boolean;
    error: string | null;
  };
  const {
    permissions: rawPermissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = useStaffPermissions(id || "");
  const emptyPermissions: UserPermissionsWithAnalise = {
    seasons: false,
    categories: false,
    stages: false,
    pilots: false,
    classification: false,
    regulations: false,
    penalties: false,
    raceDay: false,
    editChampionship: false,
    gridTypes: false,
    scoringSystems: false,
    sponsors: false,
    staff: false,
    asaasAccount: false,
    analise: false,
  };
  const permissions: UserPermissionsWithAnalise =
    rawPermissions || emptyPermissions;

  // Mapeamento de tabs (aceita inglês e português)
  const tabMapping: { [key: string]: string } = {
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
    analise: "analise",
    analises: "analises",
  };

  // Obter dados do campeonato do contexto
  const championship = getChampionshipInfo();
  const seasons = getSeasons();

  // Configurar o championshipId no contexto quando o ID mudar
  useEffect(() => {
    if (id) {
      setChampionshipId(id);
    } else {
      setChampionshipId(null);
    }
  }, [id, setChampionshipId]);

  // Função para lidar com a mudança de tab
  const handleTabChange = useCallback(
    async (value: string) => {
      setActiveTab(value);
      setSearchParams({ tab: value });

      // Se a tab de classificação foi clicada, chamar as funções necessárias
      if (value === "classificacao" && seasons.length > 0) {
        // Selecionar temporada ativa por padrão ou a primeira disponível
        const activeSeason =
          seasons.find((s: any) => s.status === "em_andamento") || seasons[0];
        if (activeSeason) {
          try {
            setClassificationLoading(true);
            await refreshClassification(activeSeason.id);
          } catch (error) {
            console.error("Erro ao carregar classificação:", error);
          } finally {
            setClassificationLoading(false);
          }
        }
      }
    },
    [setSearchParams, seasons, refreshClassification],
  );

  // Ler o parâmetro tab da URL ao montar o componente
  useEffect(() => {
    if (!championship || !championship.seasons || !permissions) return;

    const tabFromUrl = searchParams.get("tab");
    const hasSeasons = championship.seasons.length > 0;
    const hasCategories =
      hasSeasons &&
      (championship.seasons as Season[]).some(
        (s) => s.categories && s.categories.length > 0,
      );
    const hasStages =
      hasSeasons &&
      (championship.seasons as Season[]).some(
        (s) => s.stages && s.stages.length > 0,
      );

    const disabledTabsWithoutSeasons = [
      "categorias",
      "etapas",
      "regulamento",
    ];
    const disabledTabsWithoutCategories = ["etapas"];

    // Mapeamento de tabs para permissões
    const tabPermissions: { [key: string]: keyof typeof permissions } = {
      temporadas: "seasons",
      categorias: "categories",
      etapas: "stages",
      classificacao: "classification",
      regulamento: "regulations",
      penalties: "penalties",
      "race-day": "raceDay",
      "config-edit": "editChampionship",
      "config-grid": "gridTypes",
      "config-scoring": "scoringSystems",
      "config-sponsors": "sponsors",
      "config-staff": "staff",
      "config-asaas": "asaasAccount",
      analise: "staff",
      analises: "analise",
    };

    if (tabFromUrl) {
      const mappedTab = tabMapping[tabFromUrl.toLowerCase()];

      if (mappedTab) {
        let shouldRedirect = false;

        // Verificar se o usuário tem permissão para a aba
        const requiredPermission = tabPermissions[mappedTab];
        if (requiredPermission && !permissions[requiredPermission]) {
          shouldRedirect = true;
        }

        // Verificar se há dados necessários
        if (!hasSeasons && disabledTabsWithoutSeasons.includes(mappedTab)) {
          shouldRedirect = true;
        } else if (
          !hasCategories &&
          disabledTabsWithoutCategories.includes(mappedTab)
        ) {
          shouldRedirect = true;
        }

        if (shouldRedirect) {
          // Redirecionar para a primeira aba disponível
          const availableTabs = Object.entries(tabPermissions)
            .filter(([tab, permission]) => permissions[permission])
            .map(([tab]) => tab);

          const firstAvailableTab = availableTabs[0] || "temporadas";

          if (activeTab !== firstAvailableTab) {
            setActiveTab(firstAvailableTab);
            setSearchParams({ tab: firstAvailableTab });
          }
        } else if (activeTab !== mappedTab) {
          setActiveTab(mappedTab);
        }
      }
    }
  }, [searchParams, championship, activeTab, setSearchParams, permissions]);

  // Loading state
  if (contextLoading.championshipInfo || permissionsLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Loading type="spinner" size="lg" />
      </div>
    );
  }

  // Error state
  if (
    contextError.championshipInfo ||
    permissionsError ||
    !championship ||
    !id
  ) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {contextError.championshipInfo ||
              permissionsError ||
              "Campeonato não encontrado"}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const hasSeasons = !!championship?.seasons?.length;
  const hasCategories =
    hasSeasons &&
    (championship.seasons as Season[]).some(
      (s) => s.categories && s.categories.length > 0,
    );
  const hasStages =
    hasSeasons &&
    (championship.seasons as Season[]).some(
      (s) => s.stages && s.stages.length > 0,
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header do campeonato - colado com as tabs */}
      <div className="-mx-6 -mt-8">
        <ChampionshipHeader
          championship={championship}
          permissions={permissions || undefined}
        />
      </div>

      {/* Sistema de tabs unificado - colado com o header */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="h-full"
      >
        {/* Seção das tabs com fundo escuro - sem espaçamento do header */}
        <div className="bg-dark-900 text-white w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <div
            className={`container px-4 sm:px-10 ${isMobile ? "overflow-x-auto whitespace-nowrap scrollbar-hide" : ""}`}
          >
            <TabsList className="bg-transparent border-0 h-auto p-0 space-x-0">
              {permissions?.seasons && (
                <TabsTrigger
                  value="temporadas"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Temporadas
                </TabsTrigger>
              )}
              {permissions?.categories && (
                <TabsTrigger
                  value="categorias"
                  disabled={!hasSeasons}
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Categorias
                </TabsTrigger>
              )}
              {permissions?.stages && (
                <TabsTrigger
                  value="etapas"
                  disabled={!hasCategories}
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Etapas
                </TabsTrigger>
              )}
              {/* Aba Pilotos removida */}
              {permissions?.classification && (
                <TabsTrigger
                  value="classificacao"
                  disabled={!hasSeasons}
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Classificação
                </TabsTrigger>
              )}
              {permissions?.regulations && (
                <TabsTrigger
                  value="regulamento"
                  disabled={!hasSeasons}
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Regulamento
                </TabsTrigger>
              )}
              {permissions?.penalties && (
                <TabsTrigger
                  value="penalties"
                  disabled={!hasSeasons}
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Punições
                </TabsTrigger>
              )}
              {permissions?.raceDay && (
                <TabsTrigger
                  value="race-day"
                  disabled={!hasSeasons}
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Race Day
                </TabsTrigger>
              )}
              {permissions?.analise && (
                <TabsTrigger
                  value="analises"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
                >
                  Análises
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        {/* Conteúdo das tabs com espaçamento fixo */}
        <div className="px-4 pt-6">
          {permissions?.seasons && (
            <TabsContent
              value="temporadas"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <SeasonsTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.categories && hasSeasons && (
            <TabsContent
              value="categorias"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <CategoriesTab
                championshipId={id}
                seasons={championship.seasons || []}
                isLoading={contextLoading.categories}
                error={contextError.categories}
                onRefresh={() => window.location.reload()}
              />
            </TabsContent>
          )}

          {permissions?.stages && hasCategories && (
            <TabsContent
              value="etapas"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <StagesTab
                championshipId={id}
                seasons={championship.seasons || []}
                isLoading={contextLoading.stages}
                error={contextError.stages}
                onRefresh={() => window.location.reload()}
              />
            </TabsContent>
          )}

          {/* Conteúdo da aba Pilotos removido */}

          {permissions?.classification && hasSeasons && (
            <TabsContent
              value="classificacao"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              {classificationLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loading type="spinner" size="lg" />
                </div>
              ) : (
                <ClassificationTab championshipId={id} />
              )}
            </TabsContent>
          )}

          {permissions?.regulations && hasSeasons && (
            <TabsContent
              value="regulamento"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <RegulationTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.penalties && hasSeasons && (
            <TabsContent
              value="penalties"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <PenaltiesTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.raceDay && hasSeasons && (
            <TabsContent
              value="race-day"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <RaceDayTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.editChampionship && (
            <TabsContent
              value="config-edit"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <CreateChampionship />
            </TabsContent>
          )}

          {permissions?.gridTypes && (
            <TabsContent
              value="config-grid"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <GridTypesTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.scoringSystems && (
            <TabsContent
              value="config-scoring"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <ScoringSystemTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.sponsors && (
            <TabsContent
              value="config-sponsors"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <SponsorsTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.staff && (
            <TabsContent
              value="config-staff"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <StaffTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.asaasAccount && (
            <TabsContent
              value="config-asaas"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <AsaasAccountTab championshipId={id} />
            </TabsContent>
          )}

          {permissions?.analise && (
            <TabsContent
              value="analises"
              className="mt-0 ring-0 focus-visible:outline-none"
            >
              <LapTimesChart championshipId={id} />
            </TabsContent>
          )}

          {/* Mensagem quando usuário não tem acesso a nenhuma aba */}
          {permissions && Object.values(permissions).every((p) => !p) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissão para acessar nenhuma funcionalidade deste
                campeonato. Entre em contato com o administrador para solicitar
                acesso.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Tabs>
    </div>
  );
};
