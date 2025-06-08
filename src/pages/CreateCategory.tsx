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
import { CategoryData, CategoryService } from "@/lib/services/category.service";
import { SeasonService } from "@/lib/services/season.service";
import { PageHeader } from "@/components/ui/page-header";
import { useCreateCategory } from "@/hooks/use-create-category";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const CreateCategory = () => {
  const navigate = useNavigate();
  const { championshipId, seasonId, categoryId } = useParams<{ 
    championshipId: string; 
    seasonId: string; 
    categoryId?: string; 
  }>();
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
  const [isLoadingCategoryData, setIsLoadingCategoryData] = useState(false);
  const [loadCategoryError, setLoadCategoryError] = useState<string | null>(null);
  const [existingCategoryData, setExistingCategoryData] = useState<any>(null);

  // Estados para carregar dados da temporada
  const [seasonOptions, setSeasonOptions] = useState<any[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);

  const { isLoading, error, createCategory, clearError } = useCreateCategory();

  // Determinar se é modo de edição
  useEffect(() => {
    setIsEditMode(!!categoryId);
    // Reset unsaved changes when switching modes
    setHasUnsavedChanges(false);
  }, [categoryId]);

  // Carregar temporadas ativas disponíveis
  useEffect(() => {
    const loadSeasons = async () => {
      if (!championshipId) return;

      try {
        setIsLoadingSeasons(true);
        const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
        
        // Filtrar apenas temporadas ativas (agendado e em_andamento)
        const activeSeasons = seasonsData.data.filter(season => 
          season.status === 'agendado' || season.status === 'em_andamento'
        );
        
        const options = activeSeasons.map(season => ({
          value: season.id,
          description: `${season.name} (${season.status === 'agendado' ? 'Agendado' : 'Em Andamento'})`
        }));
        
        setSeasonOptions(options);
      } catch (err: any) {
        console.error('Error loading seasons:', err);
        setSeasonOptions([]);
      } finally {
        setIsLoadingSeasons(false);
      }
    };

    loadSeasons();
  }, [championshipId]);

  // Carregar dados da categoria se estiver em modo de edição
  useEffect(() => {
    const loadCategoryData = async () => {
      if (!isEditMode || !categoryId) return;

      setIsLoadingCategoryData(true);
      setLoadCategoryError(null);

      try {
        const category = await CategoryService.getById(categoryId);
        setExistingCategoryData(category);

        // Preparar dados iniciais do formulário
        const initialData = {
          name: category.name,
          ballast: category.ballast,
          maxPilots: category.maxPilots.toString(),
          batteryQuantity: category.batteryQuantity.toString(),
          startingGridFormat: category.startingGridFormat,
          minimumAge: category.minimumAge.toString(),
          seasonId: category.seasonId
        };

        setInitialFormData(initialData);
      } catch (err: any) {
        setLoadCategoryError(err.message || 'Erro ao carregar dados da categoria');
      } finally {
        setIsLoadingCategoryData(false);
      }
    };

    loadCategoryData();
  }, [isEditMode, categoryId]);

  // Helper function to check if form has changes
  const checkForChanges = useCallback((currentData: any) => {
    // Don't check for changes while loading
    if (!initialFormData || !currentData || isLoadingCategoryData || isLoadingSeasons) {
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
  }, [initialFormData, isLoadingCategoryData, isLoadingSeasons]);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && 
      !saveSuccessful && 
      !isSaving && 
      !isLoadingCategoryData && 
      !isLoadingSeasons &&
      initialFormData !== null &&
      currentLocation.pathname !== nextLocation.pathname
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
      setPendingNavigation(`/championship/${championshipId}?tab=categories`);
      setShowUnsavedChangesDialog(true);
    } else {
      navigate(`/championship/${championshipId}?tab=categories`);
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

    // Determine final seasonId
    const finalSeasonId = data.seasonId || seasonId;
    
    if (!finalSeasonId) {
      setShowErrorAlert(true);
      setIsSaving(false);
      return;
    }

    // Prepare category data
    const categoryData: CategoryData = {
      name: data.name,
      ballast: data.ballast,
      maxPilots: parseInt(data.maxPilots),
      batteryQuantity: parseInt(data.batteryQuantity),
      startingGridFormat: data.startingGridFormat,
      minimumAge: parseInt(data.minimumAge),
      seasonId: finalSeasonId
    };

    try {
      let category;
      
      if (isEditMode && categoryId) {
        // Atualizar categoria existente
        category = await CategoryService.update(categoryId, categoryData);
      } else {
        // Criar nova categoria
        category = await createCategory(categoryData);
      }
      
      if (category) {
        setSaveSuccessful(true);
        navigate(`/championship/${championshipId}?tab=categories`);
      }
    } catch (err: any) {
      console.error('Error saving category:', err);
      setShowErrorAlert(true);
      scrollToFirstError();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    clearError();
  };

  // Create form configuration
  useEffect(() => {
    if (!seasonOptions.length && isLoadingSeasons) return;

    const config: FormSectionConfig[] = [
      {
        section: "Dados da Categoria",
        detail: "Informações básicas da categoria",
        fields: [
          {
            id: "name",
            name: "Nome da categoria",
            type: "input",
            mandatory: true,
            max_char: 75,
            placeholder: "Ex: Categoria A"
          },
          {
            id: "ballast",
            name: "Lastro",
            type: "input",
            mandatory: true,
            max_char: 10,
            placeholder: "Ex: 75Kg"
          },
          {
            id: "maxPilots",
            name: "Máximo de pilotos",
            type: "input",
            mandatory: true,
            placeholder: "Ex: 20"
          },
          {
            id: "batteryQuantity",
            name: "Quantidade de baterias",
            type: "input",
            mandatory: true,
            placeholder: "Ex: 2"
          },
          {
            id: "startingGridFormat",
            name: "Formato de grid de largada",
            type: "input",
            mandatory: true,
            placeholder: "Ex: 2x2"
          },
          {
            id: "minimumAge",
            name: "Idade mínima",
            type: "input",
            mandatory: true,
            placeholder: "Ex: 18"
          }
        ]
      }
    ];

    // Sempre adicionar campo de temporada (obrigatório)
    if (seasonOptions.length > 0) {
      config[0].fields.push({
        id: "seasonId",
        name: "Temporada",
        type: "select",
        mandatory: true,
        options: seasonOptions,
        placeholder: "Selecione uma temporada"
      });
    }

    setFormConfig(config);

    // Set initial form data apenas se não estiver em modo de edição
    if (!isEditMode) {
      const initialData = {
        seasonId: seasonId || '' // Use seasonId from URL if available, otherwise empty to force selection
      };
      setInitialFormData(initialData);
    }
  }, [isEditMode, seasonOptions, isLoadingSeasons, seasonId]);

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

  // Se não há temporadas ativas disponíveis
  if (!isLoadingSeasons && seasonOptions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Criar Categoria"
          actions={[
            {
              label: "Voltar",
              onClick: () => navigate(`/championship/${championshipId}?tab=categories`),
              variant: "outline"
            }
          ]}
        />
        <div className="w-full px-6">
          <Alert>
            <AlertTitle>Nenhuma temporada ativa encontrada</AlertTitle>
            <AlertDescription>
              Para criar uma categoria, é necessário ter pelo menos uma temporada ativa (Agendado ou Em Andamento). 
              Crie uma temporada primeiro ou ative uma temporada existente.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Loading state for edit mode or seasons loading
  if (isEditMode && (isLoadingCategoryData || !existingCategoryData) || isLoadingSeasons) {
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
  if (isEditMode && loadCategoryError) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Erro"
          actions={[
            {
              label: "Voltar",
              onClick: () => navigate(`/championship/${championshipId}?tab=categories`),
              variant: "outline"
            }
          ]}
        />
        <div className="w-full px-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar categoria</AlertTitle>
            <AlertDescription>{loadCategoryError}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const pageTitle = isEditMode ? "Editar Categoria" : "Criar Categoria";
  const submitLabel = isEditMode ? "Atualizar Categoria" : "Salvar Categoria";
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
              const form = document.getElementById('category-form') as HTMLFormElement;
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
            <AlertTitle>Erro ao {isEditMode ? 'atualizar' : 'criar'} categoria</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <div className="w-full px-6" id="category-form-container">
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
          formId="category-form"
          initialValues={initialFormData || {
            seasonId: seasonId || '' // Pre-select if coming from URL, otherwise user must choose
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

export default CreateCategory; 