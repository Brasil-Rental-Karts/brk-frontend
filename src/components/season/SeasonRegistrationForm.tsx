import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { DynamicForm, FormSectionConfig } from '@/components/ui/dynamic-form';
import { SeasonService, Season } from '@/lib/services/season.service';
import { CategoryService, Category } from '@/lib/services/category.service';
import { SeasonRegistrationService, CreateRegistrationData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { masks } from '@/utils/masks';
import { useFormScreen } from '@/hooks/use-form-screen';
import { useAuth } from '@/contexts/AuthContext';

interface SeasonRegistrationFormProps {
  seasonId: string;
  onSuccess?: (registrationId: string) => void;
  onCancel?: () => void;
}

export const SeasonRegistrationForm: React.FC<SeasonRegistrationFormProps> = ({
  seasonId,
  onSuccess: onSuccessProp,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const fetchData = useCallback(async () => {
    const [seasonData, categoriesData] = await Promise.all([
      SeasonService.getById(seasonId),
      CategoryService.getBySeasonId(seasonId)
    ]);
    setSeason(seasonData);
    setCategories(categoriesData);
    return { season: seasonData, categories: categoriesData };
  }, [seasonId]);

  const {
    isLoading,
    isSaving,
    error,
    handleSubmit,
    handleFormChange: useFormScreenChange,
  } = useFormScreen<any, CreateRegistrationData>({
    id: seasonId,
    fetchData: fetchData,
    createData: (data) => SeasonRegistrationService.create(data),
    transformSubmitData: (data) => ({
      userId: user?.id || '',
      seasonId: seasonId,
      categoryIds: data.categorias || [],
      paymentMethod: data.pagamento,
      userDocument: data.cpf,
      installments: data.installments ? parseInt(data.installments, 10) : 1,
    }),
    onSuccess: (result) => {
      toast.success('Inscrição realizada com sucesso!');
      if (onSuccessProp) {
        onSuccessProp(result.registration.id);
      } else {
        navigate(`/registration/${result.registration.id}/payment`);
      }
    },
    onCancel: () => {
      if(onCancel) onCancel();
    },
    errorMessage: 'Erro ao realizar inscrição'
  });

  // Função para obter o número máximo de parcelas baseado no método de pagamento
  const getMaxInstallments = (paymentMethod: string) => {
    if (!season) return 1;
    
    switch (paymentMethod) {
      case 'pix':
        return season.pixInstallments || 1;
      case 'cartao_credito':
        return season.creditCardInstallments || 1;
      default:
        return 1;
    }
  };

  // Função para gerar opções de parcelas baseadas no método de pagamento
  const generateInstallmentOptions = (paymentMethod: string) => {
    const maxInstallments = getMaxInstallments(paymentMethod);
    
    if (maxInstallments < 1) {
      return [];
    }

    // Sempre incluir a opção 1x (à vista)
    const options = [
      {
        value: "1",
        description: `1x de ${formatCurrency(total)} (à vista)`
      }
    ];

    // Adicionar opções de 2x até o máximo permitido
    if (maxInstallments > 1) {
      for (let i = 2; i <= maxInstallments; i++) {
        const installmentValue = total / i;
        
        if (paymentMethod === 'pix') {
                        // Para PIX, explicar que é carnê (PIX parcelado)
          options.push({
            value: i.toString(),
            description: `${i}x de ${formatCurrency(installmentValue)}`
          });
        } else {
          options.push({
            value: i.toString(),
            description: `${i}x de ${formatCurrency(installmentValue)}`
          });
        }
      }
    }

    return options;
  };

  useEffect(() => {
    if (!season || !categories.length) return;

    const paymentFields: any[] = [
      {
        id: "pagamento",
        name: "Método de Pagamento",
        type: "select",
        mandatory: true,
        options: season.paymentMethods.map(method => ({
          value: method,
          description: method === 'pix' ? 'PIX - Aprovação Instantânea' : 'Cartão de Crédito'
        }))
      }
    ];

    // Adicionar campo de parcelas se houver método de pagamento selecionado
    if (selectedPaymentMethod && total > 0) {
      const installmentOptions = generateInstallmentOptions(selectedPaymentMethod);
      
      if (installmentOptions.length > 0) {
        paymentFields.push({
          id: "installments",
          name: "Número de Parcelas",
          type: "select",
          mandatory: true,
          placeholder: "Selecione o número de parcelas",
          options: installmentOptions,
        });
      }
    }

    const config: FormSectionConfig[] = [
      {
        section: "Seleção de Categorias",
        detail: "Escolha as categorias que deseja participar",
        fields: [
          {
            id: "categorias",
            name: "Categorias Disponíveis",
            type: "checkbox-group",
            mandatory: true,
            options: categories.map(category => ({
              value: category.id,
              description: `${category.name} - ${formatCurrency(Number(season.inscriptionValue))} | Lastro: ${category.ballast}kg | Max. Pilotos: ${category.maxPilots} | Idade mín.: ${category.minimumAge} anos`
            }))
          }
        ]
      },
      {
        section: "Forma de Pagamento",
        detail: "Selecione como deseja pagar",
        fields: paymentFields,
      },
      {
        section: "Informações Pessoais",
        detail: "Dados obrigatórios para a inscrição",
        fields: [
          {
            id: "cpf",
            name: "CPF/CNPJ",
            type: "text",
            mandatory: true,
            placeholder: "000.000.000-00 ou 00.000.000/0000-00",
            maxLength: 18,
            transform: (value: string) => {
              const numbers = value.replace(/\D/g, '');
              if (numbers.length <= 11) {
                return masks.cpf(value);
              } else {
                return masks.cnpj(value);
              }
            }
          }
        ]
      }
    ];

    setFormConfig(config);
  }, [season, categories, selectedPaymentMethod, total]);

  const calculateTotal = (selectedCategories: string[]) => {
    if (!season || !selectedCategories.length) {
      setTotal(0);
      return;
    }
    
    const newTotal = selectedCategories.length * Number(season.inscriptionValue);
    setTotal(newTotal);
  };

  const handleFormChange = (data: any) => {
    useFormScreenChange(data);
    
    // Atualizar método de pagamento selecionado
    if (data.pagamento !== selectedPaymentMethod) {
      setSelectedPaymentMethod(data.pagamento || '');
    }
    
    // Calcular total baseado nas categorias selecionadas
    if (data.categorias && Array.isArray(data.categorias)) {
      calculateTotal(data.categorias);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando dados da temporada...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro: {error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-blue-600 hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Temporada não encontrada</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se as inscrições estão abertas
  if (!season.registrationOpen) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{season.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-800 font-medium">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Inscrições Fechadas
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">As inscrições para esta temporada não estão abertas</h3>
              <p className="text-muted-foreground mb-4">
                Entre em contato com os organizadores para mais informações sobre quando as inscrições serão abertas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left bg-gray-50 p-4 rounded-lg">
                <div>
                  <strong>Valor por categoria:</strong> {formatCurrency(Number(season.inscriptionValue))}
                </div>
                <div>
                  <strong>Tipo de inscrição:</strong> {season.inscriptionType === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
                </div>
                <div>
                  <strong>Início:</strong> {new Date(season.startDate).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <strong>Fim:</strong> {new Date(season.endDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {onCancel && (
                <button 
                  onClick={onCancel}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Voltar
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>{season.name}</span>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Inscrições Abertas
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Valor por categoria:</strong> {formatCurrency(Number(season.inscriptionValue))}
            </div>
            <div>
              <strong>Tipo:</strong> {season.inscriptionType === 'por_temporada' ? 'Por Temporada' : 'Por Etapa'}
            </div>
            <div>
              <strong>Total calculado:</strong> <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Informações sobre parcelamento */}
          {season.inscriptionType === 'por_temporada' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Condições de Pagamento:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                {season.paymentMethods.includes('pix') && (
                  <div>
                    <strong>PIX:</strong> até {season.pixInstallments || 1}x
                  </div>
                )}
                {season.paymentMethods.includes('cartao_credito') && (
                  <div>
                    <strong>Cartão:</strong> até {season.creditCardInstallments || 1}x
                  </div>
                )}
              </div>
              
              {/* Explicação sobre PIX parcelado */}
              {selectedPaymentMethod === 'pix' && (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                  <div className="text-xs text-yellow-800">
                    <strong>PIX Parcelado:</strong> A 1ª parcela será via PIX (pagamento imediato). 
                    As demais parcelas serão PIX enviados automaticamente por email nas datas de vencimento.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DynamicForm
        config={formConfig}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
        onCancel={onCancel}
        submitLabel={isSaving ? "Finalizando..." : "Finalizar Inscrição"}
        cancelLabel="Cancelar"
        showButtons={true}
        initialValues={{
          categorias: [],
          pagamento: '',
          cpf: '',
          installments: '1',
        }}
      />
    </div>
  );
}; 