import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { Plus, Users, CreditCard, Trophy, TrendingUp, MapPin, RefreshCw, Database } from "lucide-react";
import { AdminPilotRegistration } from "@/components/admin/AdminPilotRegistration";
import { RaceTrackManagement } from "@/components/admin/RaceTrackManagement";
import { useAdminStats, usePreloadUsersCache } from "@/hooks/use-admin-stats";
import { toast } from "sonner";

export const Admin = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, loading, error, refresh } = useAdminStats();
  const { preloadUsers, loading: preloadLoading, error: preloadError, result: preloadResult } = usePreloadUsersCache();
  const navigate = useNavigate();

  // Handle URL parameters for tab navigation
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
  };

  // Check URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'pilot-registration', 'race-tracks', 'system'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Handle preload result
  useEffect(() => {
    if (preloadResult) {
      toast.success(`Cache atualizado com sucesso! ${preloadResult.totalUsers} usuários carregados em ${preloadResult.duration}`, {
        duration: 5000,
      });
    }
  }, [preloadResult]);

  // Handle preload error
  useEffect(() => {
    if (preloadError) {
      toast.error(`Erro ao atualizar cache: ${preloadError}`, {
        duration: 5000,
      });
    }
  }, [preloadError]);

  const handleCreateRaceTrack = () => {
    navigate('/admin/race-tracks/create');
  };

  const handlePreloadUsers = async () => {
    await preloadUsers();
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel de Administração</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Área administrativa para gerenciamento do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-1.5">Visão Geral</TabsTrigger>
          <TabsTrigger value="pilot-registration" className="text-xs sm:text-sm py-2 sm:py-1.5">Inscrições</TabsTrigger>
          <TabsTrigger value="race-tracks" className="text-xs sm:text-sm py-2 sm:py-1.5">Kartódromos</TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm py-2 sm:py-1.5">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando estatísticas...</div>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-destructive text-center">
                  <p className="font-medium">Erro ao carregar estatísticas</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refresh}
                    className="mt-3"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {stats && (
            <>
              <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuários registrados no sistema
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Usuários com Inscrições</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.totalUsersWithRegistrations}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuários únicos com pelo menos uma inscrição
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Pilotos Confirmados</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalConfirmedRegistrations}</div>
                    <p className="text-xs text-muted-foreground">
                      Soma de pilotos confirmados em todos os campeonatos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Campeonatos</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.championshipsStats.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total de campeonatos no sistema
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Estatísticas por Campeonato</CardTitle>
                  <CardDescription className="text-sm">
                    Detalhamento de inscrições e usuários por campeonato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.championshipsStats.map((championship) => (
                      <div key={championship.id} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                          <h3 className="font-semibold text-base sm:text-lg">{championship.name}</h3>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {championship.totalUsers} usuários
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="text-center sm:text-left">
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">{championship.pilotsEnrolled}</div>
                            <div className="text-muted-foreground text-xs">Pilotos Inscritos</div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div className="text-lg sm:text-2xl font-bold text-green-600">{championship.pilotsConfirmed}</div>
                            <div className="text-muted-foreground text-xs">Pilotos Confirmados</div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{championship.pilotsPending}</div>
                            <div className="text-muted-foreground text-xs">Pilotos Pendentes</div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div className="text-lg sm:text-2xl font-bold text-red-600">{championship.pilotsOverdue}</div>
                            <div className="text-muted-foreground text-xs">Pilotos Atrasados</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Legenda das Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
                    <p><strong>Pilotos Inscritos:</strong> Todos que se inscreveram no campeonato</p>
                    <p><strong>Pilotos Confirmados:</strong> Pagaram tudo, pelo menos uma parcela, são isentos ou têm pagamento direto</p>
                    <p><strong>Pilotos Pendentes:</strong> Ainda não pagaram nenhuma parcela, mas as parcelas estão pendentes</p>
                    <p><strong>Pilotos Atrasados:</strong> Deixaram vencer a parcela</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}


        </TabsContent>

        <TabsContent value="pilot-registration" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Inscrições Administrativas de Pilotos</CardTitle>
              <CardDescription className="text-sm">
                Adicione pilotos a temporadas com status de pagamento administrativo (isento ou pagamento direto).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminPilotRegistration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="race-tracks" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Gerenciamento de Kartódromos</h2>
              <p className="text-muted-foreground text-sm">
                Cadastre e gerencie os kartódromos disponíveis no sistema
              </p>
            </div>
            <Button onClick={handleCreateRaceTrack} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Kartódromo
            </Button>
          </div>
          <RaceTrackManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Configurações do Sistema</CardTitle>
              <CardDescription className="text-sm">
                Configurações gerais do sistema e monitoramento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Cache Redis</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Atualize o cache Redis com todos os dados dos usuários para melhor performance do sistema.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handlePreloadUsers}
                      disabled={preloadLoading}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      {preloadLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" />
                          Atualizar Cache de Usuários
                        </>
                      )}
                    </Button>
                    {preloadResult && (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {preloadResult.totalUsers} usuários carregados em {preloadResult.duration}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Outras Funcionalidades</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Outras funcionalidades de sistema em desenvolvimento...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 