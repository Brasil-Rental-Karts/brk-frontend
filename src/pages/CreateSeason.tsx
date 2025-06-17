import { useNavigate, useParams } from "react-router-dom";
import { FormScreen } from "@/components/ui/FormScreen";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { SeasonData, SeasonService } from "@/lib/services/season.service";
import { formatDateForDisplay, formatDateToISO, formatCurrency } from "@/utils/date";
import { useEffect, useState } from "react";

export const CreateSeason = () => {
  const navigate = useNavigate();
  const { championshipId, seasonId } = useParams<{ championshipId: string; seasonId?: string }>();
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const isEditMode = seasonId !== 'new';
  const currentSeasonId = isEditMode ? seasonId : undefined;

  useEffect(() => {
    const config: FormSectionConfig[] = [
      {
        section: "Dados Gerais",
        detail: "Informações básicas da temporada",
        fields: [
          {
            id: "name",
            name: "Nome da temporada",
            type: "input",
            mandatory: true,
            max_char: 75,
            placeholder: "Ex: Temporada 2024/1"
          },
          {
            id: "seasonImage",
            name: "Imagem da temporada",
            type: "file",
            mandatory: true,
            placeholder: "Faça upload da imagem ou insira uma URL",
            accept: "image/*",
            maxSize: 5,
            showPreview: true
          },
          {
            id: "description",
            name: "Descrição",
            type: "textarea",
            mandatory: true,
            max_char: 1000,
            placeholder: "Descrição detalhada da temporada, regulamento, categorias, etc."
          },
          {
            id: "startDate",
            name: "Data de início",
            type: "inputMask",
            mandatory: true,
            mask: "date",
            placeholder: "DD/MM/AAAA"
          },
          {
            id: "endDate",
            name: "Data de fim",
            type: "inputMask",
            mandatory: true,
            mask: "date",
            placeholder: "DD/MM/AAAA"
          },
          {
            id: "status",
            name: "Status",
            type: "select",
            mandatory: true,
            options: [
              { value: "agendado", description: "Agendado" },
              { value: "em_andamento", description: "Em andamento" },
              { value: "cancelado", description: "Cancelado" },
              { value: "finalizado", description: "Finalizado" }
            ]
          }
        ]
      },
      {
        section: "Dados Financeiros",
        detail: "Informações sobre inscrições e pagamentos",
        fields: [
          {
            id: "inscriptionValue",
            name: "Valor da inscrição",
            type: "inputMask",
            mandatory: true,
            mask: "currency",
            placeholder: "R$ 0,00"
          },
          {
            id: "inscriptionType",
            name: "Tipo da inscrição",
            type: "select",
            mandatory: true,
            options: [
              { value: "mensal", description: "Mensal" },
              { value: "anual", description: "Anual" },
              { value: "semestral", description: "Semestral" },
              { value: "trimestral", description: "Trimestral" }
            ]
          },
          {
            id: "paymentMethods",
            name: "Condições de pagamento",
            type: "checkbox-group",
            mandatory: true,
            options: [
              { value: "pix", description: "PIX" },
              { value: "cartao_credito", description: "Cartão de Crédito" },
              { value: "boleto", description: "Boleto" },
            ]
          }
        ]
      }
    ];
    setFormConfig(config);
  }, []);

  const transformInitialData = (season: any) => {
    return {
      name: season.name,
      seasonImage: season.seasonImage,
      description: season.description,
      startDate: formatDateForDisplay(season.startDate),
      endDate: formatDateForDisplay(season.endDate),
      status: season.status,
      inscriptionValue: formatCurrency(parseFloat(season.inscriptionValue?.toString() || '0')),
      inscriptionType: season.inscriptionType,
      paymentMethods: season.paymentMethods || []
    };
  };

  const transformSubmitData = (data: any): SeasonData => {
    return {
      name: data.name,
      seasonImage: data.seasonImage,
      description: data.description,
      startDate: formatDateToISO(data.startDate) || '',
      endDate: formatDateToISO(data.endDate) || '',
      status: data.status || 'agendado',
      inscriptionValue: parseFloat(data.inscriptionValue.replace(/[^\d,]/g, '').replace(',', '.')),
      inscriptionType: data.inscriptionType,
      paymentMethods: data.paymentMethods || [],
      championshipId: championshipId!
    };
  };

  const onSuccess = () => {
    navigate(`/championship/${championshipId}`, { replace: true });
  };

  const onCancel = () => {
    navigate(`/championship/${championshipId}`);
  };

  if (!championshipId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">ID do campeonato não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <FormScreen
      title={isEditMode ? "Editar Temporada" : "Criar Temporada"}
      formId="season-form"
      formConfig={formConfig}
      id={currentSeasonId}
      fetchData={isEditMode ? () => SeasonService.getById(currentSeasonId!) : undefined}
      createData={(data) => SeasonService.create(data)}
      updateData={(id, data) => SeasonService.update(id, data)}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      initialValues={SEASON_INITIAL_VALUES}
      successMessage={isEditMode ? "Temporada atualizada com sucesso!" : "Temporada criada com sucesso!"}
      errorMessage={isEditMode ? "Erro ao atualizar temporada." : "Erro ao criar temporada."}
    />
  );
};

const SEASON_INITIAL_VALUES = {
  name: "",
  seasonImage: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "agendado",
  inscriptionValue: "",
  inscriptionType: "",
  paymentMethods: []
};

export default CreateSeason; 