import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { Plus, Users, CreditCard, Trophy, TrendingUp } from "lucide-react";
import { AdminPilotRegistration } from "@/components/admin/AdminPilotRegistration";
import { useAdminStats } from "@/hooks/use-admin-stats";

export const Admin = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, loading, error, refresh } = useAdminStats();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Painel de Administração</h1>
        <p className="text-muted-foreground mt-2">
          Área administrativa para gerenciamento do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="pilot-registration">Inscrições de Pilotos</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuários registrados no sistema
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuários com Inscrições</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{stats.totalUsersWithRegistrations}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuários únicos com pelo menos uma inscrição
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pilotos Confirmados</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.totalConfirmedRegistrations}</div>
                    <p className="text-xs text-muted-foreground">
                      Soma de pilotos confirmados em todos os campeonatos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Campeonatos</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{stats.championshipsStats.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total de campeonatos no sistema
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas por Campeonato</CardTitle>
                  <CardDescription>
                    Detalhamento de inscrições e usuários por campeonato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.championshipsStats.map((championship) => (
                      <div key={championship.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{championship.name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {championship.totalUsers} usuários
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{championship.pilotsEnrolled}</div>
                            <div className="text-muted-foreground">Pilotos Inscritos</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{championship.pilotsConfirmed}</div>
                            <div className="text-muted-foreground">Pilotos Confirmados</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-600">{championship.pilotsPending}</div>
                            <div className="text-muted-foreground">Pilotos Pendentes</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600">{championship.pilotsOverdue}</div>
                            <div className="text-muted-foreground">Pilotos Atrasados</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Legenda das Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
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

        <TabsContent value="pilot-registration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inscrições Administrativas de Pilotos</CardTitle>
              <CardDescription>
                Adicione pilotos a temporadas com status de pagamento administrativo (isento ou pagamento direto).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminPilotRegistration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configurações gerais do sistema e monitoramento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Funcionalidades de sistema em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
      );
  }; 