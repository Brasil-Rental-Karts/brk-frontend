import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { DynamicForm, FormSectionConfig } from '@/components/ui/dynamic-form';
import { SeasonService, Season } from '@/lib/services/season.service';
import { CategoryService, Category } from '@/lib/services/category.service';
import { SeasonRegistrationService, CreateRegistrationData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { useFormScreen } from '@/hooks/use-form-screen';

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
  const [season, setSeason] = useState<Season | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);

  const {
    isLoading,
    isSaving,
    error,
    handleSubmit,
    handleFormChange: useFormScreenChange,
  } = useFormScreen<any, CreateRegistrationData>({
    id: seasonId,
    fetchData: async () => {
      const [seasonData, categoriesData] = await Promise.all([
        SeasonService.getById(seasonId),
        CategoryService.getBySeasonId(seasonId)
      ]);
      setSeason(seasonData);
      setCategories(categoriesData);
      return { season: seasonData, categories: categoriesData };
    },
    createData: (data) => SeasonRegistrationService.create(data),
    transformSubmitData: (data) => ({
      seasonId: seasonId,
      categoryIds: data.categorias || [],
      paymentMethod: data.pagamento,
      userDocument: data.cpf || undefined
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

  useEffect(() => {
    if (!season || !categories.length) return;

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
        fields: [
          {
            id: "pagamento",
            name: "Método de Pagamento",
            type: "select",
            mandatory: true,
            options: [
              { value: "pix", description: "PIX - Aprovação Instantânea" },
              { value: "cartao_credito", description: "Cartão de Crédito" },
              { value: "boleto", description: "Boleto Bancário" }
            ]
          }
        ]
      },
      {
        section: "Informações Adicionais",
        detail: "Dados opcionais para personalização",
        fields: [
          {
            id: "cpf",
            name: "CPF/CNPJ (Opcional)",
            type: "inputMask",
            mask: "cpf",
            placeholder: "000.000.000-00"
          }
        ]
      }
    ];

    setFormConfig(config);
  }, [season, categories]);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{season.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Valor por categoria:</strong> {formatCurrency(Number(season.inscriptionValue))}
            </div>
            <div>
              <strong>Total calculado:</strong> <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
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
          cpf: ''
        }}
      />
    </div>
  );
}; 