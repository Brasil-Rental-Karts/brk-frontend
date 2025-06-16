import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { ChampionshipHeader } from "@/components/championship/ChampionshipHeader";
import { SeasonsTab } from "@/components/championship/tabs/SeasonsTab";
import { CategoriesTab } from "@/components/championship/tabs/CategoriesTab";
import { PilotsTab } from "@/components/championship/tabs/PilotsTab";
import { StagesTab } from "@/components/championship/tabs/StagesTab";
import { GridTypesTab } from "@/components/championship/settings/GridTypesTab";
import { ScoringSystemTab } from "@/components/championship/settings/ScoringSystemTab";
import { AsaasAccountTab } from "@/components/championship/settings/AsaasAccountTab";
import { EditChampionshipTab } from "@/components/championship/settings/EditChampionshipTab";
import { SponsorsTab } from "@/components/championship/settings/SponsorsTab";
import { ClassificationTab } from "@/components/championship/tabs/ClassificationTab";
import { useChampionship } from "@/hooks/use-championship";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { AlertTriangle } from "lucide-react";

/**
 * Página principal do campeonato
 * Exibe as informações detalhadas de um campeonato específico
 * com tabs para temporadas, categorias e configurações
 */
export const Championship = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("temporadas");

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
    'edit-data': 'config-edit',
    'config-edit': 'config-edit',
    'sponsors': 'config-sponsors',
    'config-sponsors': 'config-sponsors',
    'grid-types': 'config-grid',
    'config-grid': 'config-grid',
    'scoring-systems': 'config-scoring',
    'config-scoring': 'config-scoring',
    'asaas-account': 'config-asaas',
    'config-asaas': 'config-asaas',
    'classificacao': 'classificacao'
  };

  // Ler o parâmetro tab da URL ao montar o componente
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    console.log('=== Championship Tab Debug ===');
    console.log('tabFromUrl:', tabFromUrl);
    
    if (tabFromUrl) {
      const mappedTab = tabMapping[tabFromUrl.toLowerCase()];
      console.log('mappedTab:', mappedTab);
      
      if (mappedTab) {
        console.log('Setting activeTab to:', mappedTab);
        setActiveTab(mappedTab);
      } else {
        console.log('Invalid tab, using default: temporadas');
      }
    }
  }, [searchParams]);
  
  const {
    championship,
    loading,
    error,
    refresh
  } = useChampionship(id);

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
        <div className="bg-dark-900 border-b border-white/10 -mx-6">
          <div className="px-10">
            <TabsList className="bg-transparent border-0 h-auto p-0 space-x-0">
              <TabsTrigger 
                value="temporadas" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Temporadas
              </TabsTrigger>
              <TabsTrigger 
                value="categorias" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Categorias
              </TabsTrigger>
              <TabsTrigger 
                value="etapas" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Etapas
              </TabsTrigger>
              <TabsTrigger 
                value="pilotos" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Pilotos
              </TabsTrigger>
              <TabsTrigger 
                value="classificacao" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Classificação
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Conteúdo das tabs com espaçamento fixo */}
        <div className="px-4 pt-6">
          <TabsContent value="temporadas" className="mt-0 ring-0 focus-visible:outline-none">
            <SeasonsTab championshipId={id} />
          </TabsContent>

          <TabsContent value="categorias" className="mt-0 ring-0 focus-visible:outline-none">
            <CategoriesTab championshipId={id} />
          </TabsContent>

          <TabsContent value="etapas" className="mt-0 ring-0 focus-visible:outline-none">
            <StagesTab championshipId={id} />
          </TabsContent>

          <TabsContent value="pilotos" className="mt-0 ring-0 focus-visible:outline-none">
            <PilotsTab championshipId={id} />
          </TabsContent>

          <TabsContent value="classificacao" className="mt-0 ring-0 focus-visible:outline-none">
            <ClassificationTab championshipId={id} />
          </TabsContent>

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

          <TabsContent value="config-asaas" className="mt-0 ring-0 focus-visible:outline-none">
            <AsaasAccountTab championshipId={id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}; 