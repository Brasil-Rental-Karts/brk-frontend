import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipHeader } from "@/components/championship/ChampionshipHeader";
import { SeasonsTab } from "@/components/championship/tabs/SeasonsTab";
import { StagesTab } from "@/components/championship/tabs/StagesTab";
import { CategoriesTab } from "@/components/championship/tabs/CategoriesTab";
import { ClassificationTab } from "@/components/championship/tabs/ClassificationTab";
import { EventTab } from "@/components/championship/tabs/EventTab";
import { useChampionship } from "@/hooks/use-championship";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

/**
 * Página principal do campeonato
 * Exibe as informações detalhadas de um campeonato específico
 * com tabs para temporadas, etapas, categorias, classificação e eventos
 */
export const Championship = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("temporadas");
  
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
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
                value="etapas" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Etapas
              </TabsTrigger>
              <TabsTrigger 
                value="categorias" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Categorias
              </TabsTrigger>
              <TabsTrigger 
                value="classificacao" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Classificação
              </TabsTrigger>
              <TabsTrigger 
                value="evento" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-white/70 hover:text-white border-b-2 border-transparent rounded-none px-4 py-3 transition-colors"
              >
                Evento
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Conteúdo das tabs com espaçamento fixo */}
        <div className="px-4 pt-6">
          <TabsContent value="temporadas" className="mt-0 ring-0 focus-visible:outline-none">
            <SeasonsTab championshipId={id} />
          </TabsContent>

          <TabsContent value="etapas" className="mt-0 ring-0 focus-visible:outline-none">
            <StagesTab championshipId={id} />
          </TabsContent>

          <TabsContent value="categorias" className="mt-0 ring-0 focus-visible:outline-none">
            <CategoriesTab championshipId={id} />
          </TabsContent>

          <TabsContent value="classificacao" className="mt-0 ring-0 focus-visible:outline-none">
            <ClassificationTab championshipId={id} />
          </TabsContent>

          <TabsContent value="evento" className="mt-0 ring-0 focus-visible:outline-none">
            <EventTab championshipId={id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}; 