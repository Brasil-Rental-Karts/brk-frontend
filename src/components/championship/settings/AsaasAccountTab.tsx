import { useState, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Skeleton } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Save,
  Wallet
} from "lucide-react";
import { Championship, ChampionshipService, AsaasStatus } from "@/lib/services/championship.service";
import { Loading } from '@/components/ui/loading';

interface AsaasAccountTabProps {
  championshipId: string;
}

export const AsaasAccountTab = ({ championshipId }: AsaasAccountTabProps) => {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [asaasStatus, setAsaasStatus] = useState<AsaasStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string>("");

  // Carregar dados do campeonato e status Asaas
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [championshipData, statusData] = await Promise.all([
          ChampionshipService.getById(championshipId),
          ChampionshipService.getAsaasStatus(championshipId)
        ]);
        
        setChampionship(championshipData);
        setAsaasStatus(statusData);
        setWalletId(statusData?.asaasWalletId || "");
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [championshipId]);

  const handleSaveWalletId = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Atualizar o campeonato com o novo Wallet ID
      await ChampionshipService.updateAsaasWalletId(championshipId, walletId.trim());
      
      // Recarregar status após salvar
      const updatedStatus = await ChampionshipService.getAsaasStatus(championshipId);
      setAsaasStatus(updatedStatus);
      
      // TODO: Adicionar toast de sucesso
      
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar Wallet ID');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded w-full animate-pulse" />
        <div className="h-48 bg-muted rounded w-full animate-pulse" />
      </div>
    );
  }

  if (error && !asaasStatus) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao Carregar Dados</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const isConfigured = asaasStatus?.configured || false;
  const hasWalletId = Boolean(asaasStatus?.asaasWalletId);

  return (
    <div className="space-y-6">
      {/* Status da Conta Asaas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status da Conta Asaas
          </CardTitle>
          <CardDescription>
            Status atual da integração com o sistema de pagamentos Asaas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mensagem de Status da Conta */}
          {isConfigured ? (
            <Alert variant="success">
              <AlertTitle>Conta Configurada</AlertTitle>
              <AlertDescription>
                Conta Asaas configurada com sucesso! Agora você pode receber pagamentos com split automático.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="warning">
              <AlertTitle>Conta Não Configurada</AlertTitle>
              <AlertDescription>
                Para receber pagamentos com split automático, você precisa configurar o Wallet ID da sua conta Asaas.
              </AlertDescription>
            </Alert>
          )}

          {!asaasStatus?.splitEnabled && (
            <Alert variant="warning">
              <AlertTitle>Split Payment Desabilitado</AlertTitle>
              <AlertDescription>
                O Split Payment não está habilitado para este campeonato. 
                Habilite o Split Payment nas configurações básicas do campeonato para poder configurar o Wallet ID.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuração do Wallet ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Configuração do Wallet ID
          </CardTitle>
          <CardDescription>
            Adicione o Wallet ID da sua conta Asaas para habilitar o split de pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {asaasStatus?.splitEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletId">Wallet ID</Label>
                <Input
                  id="walletId"
                  type="text"
                  placeholder="Digite o Wallet ID da sua conta Asaas"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  O Wallet ID pode ser encontrado no painel administrativo do Asaas, 
                  na seção de configurações da sua conta.
                </p>
              </div>

              <Button 
                onClick={handleSaveWalletId}
                disabled={saving || !walletId.trim()}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Wallet ID"}
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.open("https://www.asaas.com", "_blank")}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Acessar Asaas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Como encontrar o Wallet ID</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Acesse sua conta no Asaas</li>
                <li>Vá para Configurações da Conta</li>
                <li>Procure pela seção "Wallet" ou "Carteira"</li>
                <li>Copie o ID da carteira principal</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}; 