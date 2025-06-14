import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { DynamicForm, FormSectionConfig } from '@/components/ui/dynamic-form';
import { SeasonService, Season } from '@/lib/services/season.service';
import { CategoryService, Category } from '@/lib/services/category.service';
import { SeasonRegistrationService, CreateRegistrationData } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';

interface SeasonRegistrationFormProps {
  seasonId: string;
  onSuccess?: (registrationId: string) => void;
  onCancel?: () => void;
}

export const SeasonRegistrationForm: React.FC<SeasonRegistrationFormProps> = ({
  seasonId,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);

  useEffect(() => {
    loadData();
  }, [seasonId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar temporada e categorias em paralelo
      const [seasonData, categoriesData] = await Promise.all([
        SeasonService.getById(seasonId),
        CategoryService.getBySeasonId(seasonId)
      ]);
      
      setSeason(seasonData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados da temporada');
    } finally {
      setLoading(false);
    }
  };

  // Configurar formulário quando os dados estiverem carregados
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
    if (data.categorias && Array.isArray(data.categorias)) {
      calculateTotal(data.categorias);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!season) return;

    try {
      const registrationData: CreateRegistrationData = {
        seasonId: seasonId,
        categoryIds: data.categorias || [],
        paymentMethod: data.pagamento,
        userDocument: data.cpf || undefined
      };

      const result = await SeasonRegistrationService.create(registrationData);
      
      toast.success('Inscrição realizada com sucesso!');
      
      if (onSuccess) {
        onSuccess(result.registration.id);
      } else {
        navigate(`/registration/${result.registration.id}/payment`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar inscrição');
    }
  };

  if (loading) {
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
                onClick={loadData}
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
        submitLabel="Finalizar Inscrição"
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