import { useState, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Skeleton } from "brk-design-system";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar
} from "lucide-react";
import { Championship, ChampionshipService } from "@/lib/services/championship.service";
import { getAsaasRequiredFields, formatFieldName } from "@/utils/asaas-fields";
import { ErrorDisplay } from "@/components/ErrorDisplay";

interface AsaasAccountTabProps {
  championshipId: string;
}

interface AsaasStatus {
  championshipId: string;
  splitEnabled: boolean;
  asaasCustomerId: string | null;
  asaasWalletId: string | null;
  configured: boolean;
  canRetry: boolean;
  document: string;
  personType: number;
}

export const AsaasAccountTab = ({ championshipId }: AsaasAccountTabProps) => {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [asaasStatus, setAsaasStatus] = useState<AsaasStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<any>(null);

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
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [championshipId]);

  const handleCreateAsaasAccount = async () => {
    try {
      setCreating(true);
      setError(null);
      
      const result = await ChampionshipService.createAsaasAccount(championshipId);
      
      // Recarregar status após criação
      const updatedStatus = await ChampionshipService.getAsaasStatus(championshipId);
      setAsaasStatus(updatedStatus);
      
      // Mostrar sucesso (você pode adicionar um toast aqui)
      console.log('Conta Asaas criada com sucesso:', result);
    } catch (err: any) {
      // Se for erro estruturado do Asaas, usa diretamente
      if (err.response?.data?.type === 'asaas_error') {
        setError(err.response.data);
      } else {
        // Para outros erros, usa formato simples
        setError(err.message || 'Erro ao criar conta Asaas');
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error && !asaasStatus) {
    return <ErrorDisplay error={error} />;
  }

  const isConfigured = asaasStatus?.configured || false;
  const canCreate = asaasStatus?.splitEnabled && asaasStatus?.document && !isConfigured;

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
          <div className="flex items-center justify-between">
            <span className="font-medium">Status da Configuração:</span>
            <Badge variant={isConfigured ? "default" : "secondary"} className="flex items-center gap-1">
              {isConfigured ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Configurada
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Não Configurada
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Split Payment:</span>
            <Badge variant={asaasStatus?.splitEnabled ? "default" : "secondary"}>
              {asaasStatus?.splitEnabled ? "Habilitado" : "Desabilitado"}
            </Badge>
          </div>

          {isConfigured && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Customer ID:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {asaasStatus?.asaasCustomerId}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Wallet ID:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {asaasStatus?.asaasWalletId}
                </code>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dados Necessários para Criação */}
      {championship && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados para Criação da Conta Asaas
            </CardTitle>
            <CardDescription>
              Informações que serão utilizadas para criar a subconta no Asaas. 
              Campos com asterisco (*) são obrigatórios na API do Asaas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const requiredFields = getAsaasRequiredFields(championship.personType);
                return (
                  <>
                    <div className="flex items-center gap-3">
                      {championship.personType === 0 ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Building className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">
                          {formatFieldName("Tipo de Pessoa", requiredFields.name)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.personType === 0 ? "Pessoa Física" : "Pessoa Jurídica"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatFieldName("Documento", requiredFields.cpfCnpj)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.document || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatFieldName("Nome/Razão Social", requiredFields.name)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.personType === 0 
                            ? (championship.responsibleName || "Organizador")
                            : (championship.socialReason || championship.name)
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatFieldName("E-mail", requiredFields.email)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.responsibleEmail || `organizador-${championship.document}@brk.com.br`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatFieldName("Telefone", requiredFields.phone)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.responsiblePhone || "Não informado"}
                        </p>
                      </div>
                    </div>

                    {championship.personType === 0 && championship.responsibleBirthDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {formatFieldName("Data de Nascimento", requiredFields.birthDate)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(championship.responsibleBirthDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}

                    {championship.personType === 1 && championship.companyType && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {formatFieldName("Tipo de Empresa", requiredFields.companyType)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {championship.companyType === 'MEI' && 'MEI - Microempreendedor Individual'}
                            {championship.companyType === 'LIMITED' && 'Limited - Sociedade Limitada'}
                            {championship.companyType === 'INDIVIDUAL' && 'Individual - Empresário Individual'}
                            {championship.companyType === 'ASSOCIATION' && 'Association - Associação'}
                          </p>
                        </div>
                      </div>
                    )}

                    {championship.incomeValue && (
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {formatFieldName("Faturamento/Renda Mensal", requiredFields.incomeValue)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            R$ {championship.incomeValue.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatFieldName("Endereço", requiredFields.address)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.fullAddress}, {championship.number}
                          {championship.complement && `, ${championship.complement}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatFieldName("Cidade/Estado", requiredFields.city)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.city}, {championship.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatFieldName("CEP", requiredFields.postalCode)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {championship.cep}
                        </p>
                      </div>
                    </div>

                    {championship.province && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {formatFieldName("Bairro", requiredFields.province)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {championship.province}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
                         </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>
            Gerencie a configuração da conta Asaas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorDisplay error={error} />}

          {!asaasStatus?.splitEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O Split Payment não está habilitado para este campeonato. 
                Habilite o Split Payment nas configurações básicas do campeonato para poder criar a conta Asaas.
              </AlertDescription>
            </Alert>
          )}

          {!asaasStatus?.document && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O documento (CPF/CNPJ) não foi informado. 
                Adicione o documento nas informações básicas do campeonato.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {canCreate && (
              <Button 
                onClick={handleCreateAsaasAccount}
                disabled={creating}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {creating ? "Criando..." : "Criar Conta Asaas"}
              </Button>
            )}

            {isConfigured && (
              <Button 
                variant="outline" 
                onClick={() => window.open("https://www.asaas.com", "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Acessar Asaas
              </Button>
            )}
          </div>

          {isConfigured && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Conta Asaas configurada com sucesso! Agora você pode receber pagamentos com split automático.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 