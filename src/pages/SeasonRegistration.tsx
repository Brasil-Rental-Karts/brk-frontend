import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Button } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Skeleton } from 'brk-design-system';
import { PageHeader } from '@/components/ui/page-header';
import { SeasonService, Season } from '@/lib/services/season.service';
import { CategoryService, Category } from '@/lib/services/category.service';
import { SeasonRegistrationService, CreateRegistrationData } from '@/lib/services/season-registration.service';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/currency';
import { masks } from '@/utils/masks';
import { PixPayment } from '@/components/payment/PixPayment';
import { CreditCardPayment } from '@/components/payment/CreditCardPayment';


interface FormData {
  categories: string[];
  paymentMethod: 'pix' | 'cartao_credito';
  installments: number;
  userDocument: string;
}

export const SeasonRegistration: React.FC = () => {
  const { seasonId, seasonSlug, championshipSlug } = useParams<{ 
    seasonId?: string; 
    seasonSlug?: string; 
    championshipSlug?: string; 
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados
  const [season, setSeason] = useState<Season | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    categories: [],
    paymentMethod: 'pix',
    installments: 1,
    userDocument: ''
  });

  // Determina o identificador da temporada (slug ou ID)
  const seasonIdentifier = seasonSlug || seasonId;

  // Carregar dados da temporada e categorias
  useEffect(() => {
    const loadData = async () => {
      if (!seasonIdentifier) return;

      try {
        setLoading(true);
        setError(null);

                 // Carregar temporada
         const seasonData = await SeasonService.getById(seasonIdentifier);
         setSeason(seasonData);
 
         // Carregar categorias
         const categoriesData = await CategoryService.getBySeasonId(seasonIdentifier);
        setCategories(categoriesData);

      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message || 'Erro ao carregar dados da temporada');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [seasonIdentifier]);

  // Calcular total
  const calculateTotal = () => {
    if (!season || !formData.categories.length) return 0;
    return formData.categories.length * Number(season.inscriptionValue);
  };

  // Obter máximo de parcelas por método
  const getMaxInstallments = (method: string) => {
    if (!season) return 1;
    
    switch (method) {
      case 'pix':
        return season.pixInstallments || 1;
      case 'cartao_credito':
        return season.creditCardInstallments || 1;
      default:
        return 1;
    }
  };

  // Gerar opções de parcelas
  const generateInstallmentOptions = (method: string) => {
    const maxInstallments = getMaxInstallments(method);
    const total = calculateTotal();
    
    if (maxInstallments < 1 || total === 0) return [];

    const options = [];
    
    // Sempre incluir 1x (à vista)
    options.push({
      value: 1,
      label: `1x de ${formatCurrency(total)} (à vista)`
    });

    // Adicionar opções de 2x até o máximo
    for (let i = 2; i <= maxInstallments; i++) {
      const installmentValue = total / i;
      
      if (method === 'pix') {
        // Para PIX, explicar que é carnê (PIX parcelado)
        options.push({
          value: i,
          label: `${i}x de ${formatCurrency(installmentValue)} (PIX parcelado)`
        });
      } else {
        options.push({
          value: i,
          label: `${i}x de ${formatCurrency(installmentValue)}`
        });
      }
    }

    return options;
  };

  // Aplicar máscara de CPF/CNPJ
  const applyCpfCnpjMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      return masks.cpf(value);
    } else {
      return masks.cnpj(value);
    }
  };

  // Atualizar formulário
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudou o método de pagamento, resetar parcelas
      if (field === 'paymentMethod') {
        newData.installments = 1;
      }
      
      // Aplicar máscara no campo de documento
      if (field === 'userDocument') {
        newData.userDocument = applyCpfCnpjMask(value);
      }
      
      return newData;
    });
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
         if (!user || !user.id || !season) {
       toast.error('Dados do usuário ou temporada não encontrados');
       return;
     }

    // Validações
    if (formData.categories.length === 0) {
      toast.error('Selecione pelo menos uma categoria');
      return;
    }

         if (!formData.userDocument.trim()) {
       toast.error('CPF/CNPJ é obrigatório');
       return;
     }

     // Validar se o documento tem o tamanho mínimo
     const documentNumbers = formData.userDocument.replace(/\D/g, '');
     if (documentNumbers.length < 11) {
       toast.error('CPF deve ter 11 dígitos');
       return;
     }
     if (documentNumbers.length > 11 && documentNumbers.length < 14) {
       toast.error('CNPJ deve ter 14 dígitos');
       return;
     }

    try {
      setSubmitting(true);
      setError(null);

      const registrationData: CreateRegistrationData = {
        userId: user.id,
        seasonId: season.id,
        categoryIds: formData.categories,
        paymentMethod: formData.paymentMethod,
        userDocument: formData.userDocument.trim(),
        installments: formData.installments
      };

      console.log('=== DADOS ENVIADOS PARA BACKEND ===');
      console.log('registrationData:', registrationData);
      console.log('formData.installments:', formData.installments);
      console.log('formData.paymentMethod:', formData.paymentMethod);

      const result = await SeasonRegistrationService.create(registrationData);
      
      console.log('Resultado recebido:', result);

      setRegistrationResult(result);
      setShowPayment(true);
      toast.success('Inscrição criada com sucesso!');

    } catch (err: any) {
      console.error('Erro ao criar inscrição:', err);
      setError(err.message || 'Erro ao criar inscrição');
      toast.error(err.message || 'Erro ao criar inscrição');
    } finally {
      setSubmitting(false);
    }
  };

  // Voltar para formulário
  const handleBackToForm = () => {
    setShowPayment(false);
    setRegistrationResult(null);
  };

  // Cancelar
  const handleCancel = () => {
    navigate(-1);
  };

  // Renderizar componente de pagamento
  const renderPaymentComponent = () => {
    if (!registrationResult || !registrationResult.registration || !registrationResult.paymentData) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Erro: Dados de pagamento não encontrados
          </AlertDescription>
        </Alert>
      );
    }

    const { registration, paymentData } = registrationResult;

    switch (paymentData.billingType) {
      case 'PIX':
        return (
          <PixPayment
            paymentData={paymentData}
            registration={registration}
            onPaymentComplete={() => {
              toast.success('Pagamento confirmado!');
              navigate('/dashboard');
            }}
          />
        );
      case 'CREDIT_CARD':
        return (
          <CreditCardPayment
            paymentData={paymentData}
            registration={registration}
            onPaymentComplete={() => {
              toast.success('Pagamento confirmado!');
              navigate('/dashboard');
            }}
          />
        );

      default:
        return (
          <Alert variant="destructive">
            <AlertDescription>
              Método de pagamento não suportado: {paymentData.billingType}
            </AlertDescription>
          </Alert>
        );
    }
  };

  // Verificações iniciais
  if (!seasonIdentifier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">Identificador da temporada não encontrado</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Nova Inscrição"
          subtitle="Carregando dados da temporada..."
        />
        <div className="w-full max-w-4xl mx-auto px-6 py-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Nova Inscrição"
          subtitle="Erro ao carregar dados"
        />
        <div className="w-full max-w-4xl mx-auto px-6 py-6">
          <Card>
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Temporada não encontrada</h1>
          <Button className="mt-4" onClick={handleCancel}>Voltar</Button>
        </div>
      </div>
    );
  }

  // Se está mostrando pagamento
  if (showPayment) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Pagamento da Inscrição"
          subtitle={`Temporada: ${season.name}`}
          actions={[
            {
              label: "Voltar ao Formulário",
              onClick: handleBackToForm,
              variant: "outline"
            }
          ]}
        />
        <div className="w-full max-w-4xl mx-auto px-6 py-6">
          {renderPaymentComponent()}
        </div>
      </div>
    );
  }

  // Verificar se inscrições estão abertas
  if (!season.registrationOpen) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Inscrições Fechadas"
          subtitle={`Temporada: ${season.name}`}
        />
        <div className="w-full max-w-4xl mx-auto px-6 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Badge variant="destructive" className="mb-4">
                Inscrições Fechadas
              </Badge>
              <h3 className="text-lg font-semibold mb-2">
                As inscrições para esta temporada não estão abertas
              </h3>
              <p className="text-muted-foreground mb-4">
                Entre em contato com a organização para mais informações.
              </p>
              <Button onClick={handleCancel}>Voltar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const installmentOptions = generateInstallmentOptions(formData.paymentMethod);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Nova Inscrição"
        subtitle={`Temporada: ${season.name}`}
        actions={[
          {
            label: "Cancelar",
            onClick: handleCancel,
            variant: "outline"
          }
        ]}
      />
      
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Categorias</CardTitle>
              <p className="text-sm text-muted-foreground">
                Escolha as categorias que deseja participar
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.id)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...formData.categories, category.id]
                        : formData.categories.filter(id => id !== category.id);
                      updateFormData('categories', newCategories);
                    }}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(Number(season.inscriptionValue))} | 
                      Lastro: {category.ballast}kg | 
                      Max. Pilotos: {category.maxPilots} | 
                      Idade mín.: {category.minimumAge} anos
                    </div>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione como deseja pagar
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Método de Pagamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pix"
                      checked={formData.paymentMethod === 'pix'}
                      onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                    />
                    <span>PIX - Aprovação Instantânea</span>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cartao_credito"
                      checked={formData.paymentMethod === 'cartao_credito'}
                      onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                    />
                    <span>Cartão de Crédito</span>
                  </label>

                </div>
              </div>

              {/* Parcelas */}
              {installmentOptions.length > 0 && total > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número de Parcelas</label>
                  <select
                    value={formData.installments}
                    onChange={(e) => updateFormData('installments', parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  >
                    {installmentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Resumo do Valor */}
              {total > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formData.categories.length} categoria(s) selecionada(s)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <p className="text-sm text-muted-foreground">
                Dados obrigatórios para a inscrição
              </p>
            </CardHeader>
                         <CardContent>
               <div className="space-y-2">
                 <label className="text-sm font-medium">CPF/CNPJ *</label>
                 <input
                   type="text"
                   value={formData.userDocument}
                   onChange={(e) => updateFormData('userDocument', e.target.value)}
                   placeholder="000.000.000-00 ou 00.000.000/0000-00"
                   className="w-full p-3 border rounded-lg"
                   maxLength={18} // CNPJ formatado tem 18 caracteres
                   required
                 />
                 <p className="text-xs text-muted-foreground">
                   Digite apenas os números. A máscara será aplicada automaticamente.
                 </p>
               </div>
             </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
                         <Button
               type="submit"
               disabled={
                 submitting || 
                 formData.categories.length === 0 || 
                 !formData.userDocument.trim() ||
                 formData.userDocument.replace(/\D/g, '').length < 11
               }
               className="flex-1"
             >
               {submitting ? 'Processando...' : 'Finalizar Inscrição'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 