import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { ChampionshipHeader } from "@/components/championship/ChampionshipHeader";
import { SeasonsTab } from "@/components/championship/tabs/SeasonsTab";
import { CategoriesTab } from "@/components/championship/tabs/CategoriesTab";
import { PilotsTab } from "@/components/championship/tabs/PilotsTab";
import { StagesTab } from "@/components/championship/tabs/StagesTab";
import { RegulationTab } from "@/components/championship/tabs/RegulationTab";
import { GridTypesTab } from "@/components/championship/settings/GridTypesTab";
import { ScoringSystemTab } from "@/components/championship/settings/ScoringSystemTab";
import { AsaasAccountTab } from "@/components/championship/settings/AsaasAccountTab";
import { EditChampionshipTab } from "@/components/championship/settings/EditChampionshipTab";
import { SponsorsTab } from "@/components/championship/settings/SponsorsTab";
import { StaffTab } from "@/components/championship/settings/StaffTab";
import { useChampionship } from "@/hooks/use-championship";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Category } from "@/lib/services/category.service";
import { Season as BaseSeason } from "@/lib/services/season.service";
import { Stage } from "@/lib/types/stage";

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
  const isMobile = useIsMobile();

  // Mapeamento de tabs (aceita inglês e português)
  const tabMapping: { [key: string]: string } = {
    'seasons': 'temporadas',
    'temporadas': 'temporadas',
    'categories': 'categorias',
    'categorias': 'categorias',
    'stages': 'etapas',
    'etapas': 'etapas',
    'pilots': 'pilotos',
    'pilotos': 'pilotos',
    'regulations': 'regulamento',
    'regulamento': 'regulamento',
    'edit-data': 'config-edit',
    'config-edit': 'config-edit',
    'sponsors': 'config-sponsors',
    'config-sponsors': 'config-sponsors',
    'staff': 'config-staff',
    'config-staff': 'config-staff',
    'grid-types': 'config-grid',
    'config-grid': 'config-grid',
    'scoring-systems': 'config-scoring',
    'config-scoring': 'config-scoring',
    'asaas-account': 'config-asaas',
    'config-asaas': 'config-asaas',
  };

  const {
    championship,
    loading,
    error,
    refresh
  } = useChampionship(id);

  // Ler o parâmetro tab da URL ao montar o componente
  useEffect(() => {
    if (!championship || !championship.seasons) return;

    const tabFromUrl = searchParams.get("tab");
    const hasSeasons = championship.seasons.length > 0;
    const hasCategories = hasSeasons && (championship.seasons as Season[]).some(s => s.categories && s.categories.length > 0);
    const hasStages = hasSeasons && (championship.seasons as Season[]).some(s => s.stages && s.stages.length > 0);

    const disabledTabsWithoutSeasons = ['categorias', 'etapas', 'pilotos', 'regulamento'];
    const disabledTabsWithoutCategories = ['etapas', 'pilotos'];

    if (tabFromUrl) {
      const mappedTab = tabMapping[tabFromUrl.toLowerCase()];
      
      if (mappedTab) {
        let shouldRedirect = false;
        if (!hasSeasons && disabledTabsWithoutSeasons.includes(mappedTab)) {
          shouldRedirect = true;
        } else if (!hasCategories && disabledTabsWithoutCategories.includes(mappedTab)) {
          shouldRedirect = true;
        }

        if (shouldRedirect) {
          if (activeTab !== 'temporadas') {
            setActiveTab('temporadas');
            setSearchParams({ tab: 'temporadas' });
          }
        } else if (activeTab !== mappedTab) {
          setActiveTab(mappedTab);
        }
      }
    }
  }, [searchParams, championship, activeTab, setSearchParams]);
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !championship || !id) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || "Campeonato não encontrado"}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={refresh} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const hasSeasons = !!championship?.seasons?.length;
  const hasCategories = hasSeasons && (championship.seasons as Season[]).some(s => s.categories && s.categories.length > 0);
  const hasStages = hasSeasons && (championship.seasons as Season[]).some(s => s.stages && s.stages.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header do campeonato - colado com as tabs */}
      <div className="-mx-6 -mt-8">
        <ChampionshipHeader championship={championship} />
      </div>

      {/* Sistema de tabs unificado - colado com o header */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setSearchParams({ tab: value });
      }} className="h-full">
        {/* Seção das tabs com fundo escuro - sem espaçamento do header */}
        <div className="bg-dark-900 text-white w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <div 
            className={`container px-4 sm:px-10 ${isMobile ? 'overflow-x-auto whitespace-nowrap scrollbar-hide' : ''}`}
          >
            <TabsList className="bg-transparent border-0 h-auto p-0 space-x-0">
              <TabsTrigger 
                value="temporadas" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Temporadas
              </TabsTrigger>
              <TabsTrigger 
                value="categorias" 
                disabled={!hasSeasons}
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Categorias
              </TabsTrigger>
              <TabsTrigger 
                value="etapas" 
                disabled={!hasCategories}
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Etapas
              </TabsTrigger>
              <TabsTrigger 
                value="pilotos" 
                disabled={!hasCategories}
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Pilotos
              </TabsTrigger>
              <TabsTrigger 
                value="regulamento" 
                disabled={!hasSeasons}
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Regulamento
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Conteúdo das tabs com espaçamento fixo */}
        <div className="px-4 pt-6">
          <TabsContent value="temporadas" className="mt-0 ring-0 focus-visible:outline-none">
            <SeasonsTab 
              championshipId={id} 
              seasons={championship.seasons || []}
              isLoading={loading}
              error={error}
              onRefresh={refresh}
            />
          </TabsContent>

          {hasSeasons ? (
            <>
              <TabsContent value="categorias" className="mt-0 ring-0 focus-visible:outline-none">
                <CategoriesTab 
                  championshipId={id}
                  seasons={championship.seasons || []}
                  isLoading={loading}
                  error={error}
                  onRefresh={refresh}
                />
              </TabsContent>
    
              {hasCategories ? (
                <>
                  <TabsContent value="etapas" className="mt-0 ring-0 focus-visible:outline-none">
                    <StagesTab 
                      championshipId={id}
                      seasons={championship.seasons || []}
                      isLoading={loading}
                      error={error}
                      onRefresh={refresh}
                    />
                  </TabsContent>
        
                  <TabsContent value="pilotos" className="mt-0 ring-0 focus-visible:outline-none">
                    <PilotsTab championshipId={id} />
                  </TabsContent>
                </>
              ) : (
                !['temporadas', 'categorias', 'regulamento', 'config-edit', 'config-grid', 'config-scoring', 'config-sponsors', 'config-staff', 'config-asaas'].includes(activeTab) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Este campeonato ainda não possui categorias. Crie uma categoria para habilitar as outras abas.
                    </AlertDescription>
                  </Alert>
                )
              )}

              <TabsContent value="regulamento" className="mt-0 ring-0 focus-visible:outline-none">
                <RegulationTab 
                  championshipId={id}
                  seasons={championship.seasons || []}
                  isLoading={loading}
                  error={error}
                  onRefresh={refresh}
                />
              </TabsContent>
            </>
          ) : (
            !['temporadas', 'config-edit', 'config-grid', 'config-scoring', 'config-sponsors', 'config-staff', 'config-asaas'].includes(activeTab) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Este campeonato ainda não possui temporadas. Crie uma temporada para habilitar as outras abas.
                </AlertDescription>
              </Alert>
            )
          )}

          <TabsContent value="config-edit" className="mt-0 ring-0 focus-visible:outline-none">
            <EditChampionshipTab championshipId={id} />
          </TabsContent>

          <TabsContent value="config-grid" className="mt-0 ring-0 focus-visible:outline-none">
            <GridTypesTab championshipId={id} />
          </TabsContent>

          <TabsContent value="config-scoring" className="mt-0 ring-0 focus-visible:outline-none">
            <ScoringSystemTab championshipId={id} />
          </TabsContent>

          <TabsContent value="config-sponsors" className="mt-0 ring-0 focus-visible:outline-none">
            <SponsorsTab championshipId={id} />
          </TabsContent>

          <TabsContent value="config-staff" className="mt-0 ring-0 focus-visible:outline-none">
            <StaffTab championshipId={id} />
          </TabsContent>

          <TabsContent value="config-asaas" className="mt-0 ring-0 focus-visible:outline-none">
            <AsaasAccountTab championshipId={id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}; 