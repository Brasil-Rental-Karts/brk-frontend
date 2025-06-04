import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker, useParams } from "react-router-dom";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SeasonData, SeasonService } from "@/lib/services/season.service";
import { PageHeader } from "@/components/ui/page-header";
import { useCreateSeason } from "@/hooks/use-create-season";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { formatDateForDisplay, formatDateToISO, formatCurrency } from "@/utils/date";

export const CreateSeason = () => {
  const navigate = useNavigate();
  const { championshipId, seasonId } = useParams<{ championshipId: string; seasonId?: string }>();
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [formRef, setFormRef] = useState<any>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estados para modo de edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingSeasonData, setIsLoadingSeasonData] = useState(false);
  const [loadSeasonError, setLoadSeasonError] = useState<string | null>(null);
  const [existingSeasonData, setExistingSeasonData] = useState<any>(null);

  const { isLoading, error, createSeason, clearError } = useCreateSeason();

  // Determinar se é modo de edição
  useEffect(() => {
    setIsEditMode(!!seasonId);
  }, [seasonId]);

  // Carregar dados da temporada se estiver em modo de edição
  useEffect(() => {
    const loadSeasonData = async () => {
      if (!isEditMode || !seasonId) return;

      setIsLoadingSeasonData(true);
      setLoadSeasonError(null);

      try {
        const season = await SeasonService.getById(seasonId);
        setExistingSeasonData(season);

        // Preparar dados iniciais do formulário usando as funções utilitárias
        const initialData = {
          name: season.name,
          seasonImage: season.seasonImage,
          description: season.description,
          startDate: formatDateForDisplay(season.startDate),
          endDate: formatDateForDisplay(season.endDate),
          status: season.status,
          inscriptionValue: formatCurrency(season.inscriptionValue),
          inscriptionType: season.inscriptionType,
          paymentMethods: season.paymentMethods || []
        };

        setInitialFormData(initialData);
      } catch (err: any) {
        setLoadSeasonError(err.message || 'Erro ao carregar dados da temporada');
      } finally {
        setIsLoadingSeasonData(false);
      }
    };

    loadSeasonData();
  }, [isEditMode, seasonId]);

  // Helper function to check if form has changes
  const checkForChanges = useCallback((currentData: any) => {
    if (!initialFormData || !currentData) {
      setHasUnsavedChanges(false);
      return;
    }

    // Compare current data with initial data
    const hasChanges = Object.keys(currentData).some(key => {
      const initialValue = initialFormData[key];
      const currentValue = currentData[key];
      
      // Handle empty strings vs null/undefined
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined || val === '') return '';
        return val.toString();
      };
      
      return normalizeValue(initialValue) !== normalizeValue(currentValue);
    });

    setHasUnsavedChanges(hasChanges);
  }, [initialFormData]);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && !saveSuccessful && !isSaving && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setPendingNavigation(blocker.location.pathname);
      setShowUnsavedChangesDialog(true);
    }
  }, [blocker]);

  const handleFormChange = useCallback((data: any) => {
    checkForChanges(data);
  }, [checkForChanges]);

  const handleFieldChange = useCallback(() => {
    // Field change handling can be kept for other fields if needed
  }, []);

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(`/championship/${championshipId}`);
      setShowUnsavedChangesDialog(true);
    } else {
      navigate(`/championship/${championshipId}`);
    }
  };

  const handleConfirmNavigation = () => {
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedChangesDialog(false);
    setPendingNavigation(null);
  };

  const scrollToFirstError = () => {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('[data-invalid="true"], .text-destructive, [aria-invalid="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const handleSubmit = async (data: any) => {
    // Check if there are any validation errors
    if (formRef) {
      const formState = formRef.formState;
      if (formState.errors && Object.keys(formState.errors).length > 0) {
        scrollToFirstError();
        return;
      }
    }

    // Clear any previous errors and mark as saved
    clearError();
    setShowErrorAlert(false);
    setIsSaving(true);

    // Prepare season data using utility functions
    const seasonData: SeasonData = {
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

    try {
      let season;
      
      if (isEditMode && seasonId) {
        // Atualizar temporada existente
        season = await SeasonService.update(seasonId, seasonData);
      } else {
        // Criar nova temporada
        season = await createSeason(seasonData);
      }
      
      if (season) {
        // Success - navigate back to championship page
        setSaveSuccessful(true);
        setHasUnsavedChanges(false);
        navigate(`/championship/${championshipId}`, { replace: true });
      }
    } catch (err) {
      // Error occurred - restore unsaved changes indicator and stop saving
      setIsSaving(false);
      scrollToFirstError();
    }
  };

  // Handle alert close
  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    clearError();
  };

  // Create form configuration
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
            type: "input",
            mandatory: true,
            placeholder: "URL da imagem (sugerimos usar Cloudinary ou Cloudimage)"
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
              { value: "cartao_debito", description: "Cartão de Débito" },
              { value: "cartao_credito", description: "Cartão de Crédito" },
              { value: "boleto", description: "Boleto" }
            ]
          }
        ]
      }
    ];

    setFormConfig(config);

    // Set initial form data apenas se não estiver em modo de edição
    if (!isEditMode) {
      const initialData = {
        status: "agendado",
        paymentMethods: []
      };
      setInitialFormData(initialData);
    }
  }, [isEditMode]);

  // Show error alert when error changes
  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
    }
  }, [error]);

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

  // Loading state for edit mode
  if (isEditMode && (isLoadingSeasonData || !existingSeasonData)) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Carregando..."
          actions={[]}
        />
        <div className="w-full px-6">
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (isEditMode && loadSeasonError) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Erro"
          actions={[
            {
              label: "Voltar",
              onClick: () => navigate(`/championship/${championshipId}`),
              variant: "outline"
            }
          ]}
        />
        <div className="w-full px-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar temporada</AlertTitle>
            <AlertDescription>{loadSeasonError}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const pageTitle = isEditMode ? "Editar Temporada" : "Criar Temporada";
  const submitLabel = isEditMode ? "Atualizar Temporada" : "Salvar Temporada";
  const loadingLabel = isEditMode ? "Atualizando..." : "Salvando...";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title={pageTitle}
        actions={[
          {
            label: "Cancelar",
            onClick: handleCancelClick,
            variant: "outline",
            disabled: isLoading
          },
          {
            label: isLoading ? loadingLabel : submitLabel,
            onClick: () => {
              // Trigger form submission
              const form = document.getElementById('season-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            },
            variant: "default",
            disabled: isLoading
          }
        ]}
      />

      {/* Alerts */}
      <div className="w-full px-6 mb-4">
        {showErrorAlert && error && (
          <Alert variant="destructive" hasCloseButton onClose={handleCloseErrorAlert} className="mb-4">
            <AlertTitle>Erro ao {isEditMode ? 'atualizar' : 'criar'} temporada</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <div className="w-full px-6" id="season-form-container">
        <DynamicForm
          config={formConfig}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onFieldChange={handleFieldChange}
          onFormReady={setFormRef}
          submitLabel={isLoading ? loadingLabel : submitLabel}
          cancelLabel="Cancelar"
          showButtons={true}
          className="space-y-6"
          formId="season-form"
          initialValues={initialFormData || {
            status: "agendado",
            paymentMethods: []
          }}
        />
      </div>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja realmente sair sem salvar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNavigation}>
              Continuar editando
            </Button>
            <Button variant="destructive" onClick={handleConfirmNavigation}>
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateSeason; 