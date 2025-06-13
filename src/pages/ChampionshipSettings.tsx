import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { ArrowLeft, Settings, CreditCard } from "lucide-react";
import { GridTypesTab } from "@/components/championship/settings/GridTypesTab";
import { AsaasAccountTab } from "@/components/championship/settings/AsaasAccountTab";
import { Championship, ChampionshipService } from "@/lib/services/championship.service";
import { Skeleton } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";

/**
 * Página de configurações do campeonato
 * Contém diferentes abas para configurações específicas
 */
export const ChampionshipSettings = () => {
  const { id: championshipId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("asaas-account");
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do campeonato
  useEffect(() => {
    const loadChampionship = async () => {
      if (!championshipId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await ChampionshipService.getById(championshipId);
        setChampionship(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar campeonato');
      } finally {
        setLoading(false);
      }
    };

    loadChampionship();
  }, [championshipId]);

  const handleBack = () => {
    navigate(`/championship/${championshipId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Configurações do campeonato</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Campeonato não encontrado'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Settings className="h-7 w-7" />
              Configurações
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as configurações de {championship.name}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Campeonato</CardTitle>
          <CardDescription>
            Configure aspectos específicos do campeonato {championship.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <TabsTrigger value="grid-types" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Tipos de Grid
              </TabsTrigger>
              <TabsTrigger value="asaas-account" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Conta Asaas
              </TabsTrigger>
              {/* Futuras abas podem ser adicionadas aqui */}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="grid-types" className="mt-0">
                <GridTypesTab championshipId={championship.id} />
              </TabsContent>
              <TabsContent value="asaas-account" className="mt-0">
                <AsaasAccountTab championshipId={championship.id} />
              </TabsContent>
              {/* Futuras abas de conteúdo podem ser adicionadas aqui */}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 