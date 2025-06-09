import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryData, CategoryService } from "@/lib/services/category.service";
import { SeasonService } from "@/lib/services/season.service";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { PageHeader } from "@/components/ui/page-header";
import { useCreateCategory } from "@/hooks/use-create-category";
import { Skeleton } from "@/components/ui/skeleton";
import { BatteriesConfigForm } from "@/components/category/BatteriesConfigForm";
import { BatteriesConfig, BATTERY_TEMPLATES } from "@/lib/types/battery.types";
import { GridType } from "@/lib/types/grid-type";

export const CreateCategory = () => {
  const navigate = useNavigate();
  const { championshipId, seasonId, categoryId } = useParams<{ 
    championshipId: string; 
    seasonId: string; 
    categoryId?: string; 
  }>();

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    ballast: "",
    maxPilots: "",
    batteriesConfig: [] as BatteriesConfig,
    minimumAge: "",
    seasonId: ""
  });

  // UI states
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingCategoryData, setIsLoadingCategoryData] = useState(false);
  const [loadCategoryError, setLoadCategoryError] = useState<string | null>(null);

  // Season options
  const [seasonOptions, setSeasonOptions] = useState<any[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);

  // Grid types for batteries
  const [gridTypes, setGridTypes] = useState<GridType[]>([]);
  const [isLoadingGridTypes, setIsLoadingGridTypes] = useState(true);

  const { isLoading, error, createCategory, clearError } = useCreateCategory();

  // Determine if it's edit mode
  useEffect(() => {
    setIsEditMode(!!categoryId);
    setHasUnsavedChanges(false);
  }, [categoryId]);

  // Load seasons
  useEffect(() => {
    const loadSeasons = async () => {
      if (!championshipId) return;

      try {
        setIsLoadingSeasons(true);
        const seasonsData = await SeasonService.getByChampionshipId(championshipId, 1, 100);
        
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

  // Load grid types
  useEffect(() => {
    const loadGridTypes = async () => {
      if (!championshipId) return;

      try {
        setIsLoadingGridTypes(true);
        const gridTypesData = await GridTypeService.getByChampionship(championshipId);
        setGridTypes(gridTypesData);
      } catch (err: any) {
        console.error('Error loading grid types:', err);
        setGridTypes([]);
      } finally {
        setIsLoadingGridTypes(false);
      }
    };

    loadGridTypes();
  }, [championshipId]);

  // Load category data for edit mode
  useEffect(() => {
    const loadCategoryData = async () => {
      if (!isEditMode || !categoryId) return;

      setIsLoadingCategoryData(true);
      setLoadCategoryError(null);

      try {
        const category = await CategoryService.getById(categoryId);
        
        setFormData({
          name: category.name,
          ballast: category.ballast,
          maxPilots: category.maxPilots.toString(),
          batteriesConfig: category.batteriesConfig || BATTERY_TEMPLATES.SINGLE,
          minimumAge: category.minimumAge.toString(),
          seasonId: category.seasonId
        });
      } catch (err: any) {
        setLoadCategoryError(err.message || 'Erro ao carregar dados da categoria');
      } finally {
        setIsLoadingCategoryData(false);
      }
    };

    loadCategoryData();
  }, [isEditMode, categoryId]);

  // Set initial form data for create mode
  useEffect(() => {
    if (!isEditMode && !isLoadingSeasons && !isLoadingGridTypes && gridTypes.length > 0 && formData.batteriesConfig.length === 0) {
      const defaultGridType = gridTypes.find(gt => gt.isDefault)?.id || gridTypes[0]?.id || "";
      
      setFormData(prev => ({
        ...prev,
        seasonId: seasonId || prev.seasonId,
        batteriesConfig: [{
          name: "Bateria 1",
          gridType: defaultGridType,
          order: 1,
          isRequired: true,
          description: "Bateria principal"
        }]
      }));
    } else if (!isEditMode && seasonId && !formData.seasonId) {
      // Just update seasonId if batteriesConfig already exists
      setFormData(prev => ({
        ...prev,
        seasonId: seasonId
      }));
    }
  }, [isEditMode, seasonId, isLoadingSeasons, isLoadingGridTypes, gridTypes, formData.batteriesConfig.length, formData.seasonId]);

  // Check for unsaved changes
  const checkForChanges = useCallback(() => {
    if (isEditMode) {
      // In edit mode, check if any field has changed from initial values
      setHasUnsavedChanges(true); // Simplified for now
    } else {
      // In create mode, check if user has entered any data
      const hasData = Boolean(formData.name || formData.ballast || formData.maxPilots || 
                             formData.minimumAge || formData.batteriesConfig.length > 0);
      setHasUnsavedChanges(hasData);
    }
  }, [isEditMode, formData]);

  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && 
      !saveSuccessful && 
      !isSaving && 
      !isLoadingCategoryData && 
      !isLoadingSeasons &&
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setPendingNavigation(blocker.location.pathname);
      setShowUnsavedChangesDialog(true);
    }
  }, [blocker]);

  const handleInputChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleBatteriesConfigChange = useCallback((config: BatteriesConfig) => {
    setFormData(prev => ({
      ...prev,
      batteriesConfig: config
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    clearError();

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Nome da categoria é obrigatório');
      }
      if (!formData.ballast.trim()) {
        throw new Error('Lastro é obrigatório');
      }
      if (!formData.maxPilots || parseInt(formData.maxPilots) < 1) {
        throw new Error('Máximo de pilotos deve ser maior que 0');
      }
      if (!formData.minimumAge || parseInt(formData.minimumAge) < 1) {
        throw new Error('Idade mínima deve ser maior que 0');
      }
      if (!formData.seasonId) {
        throw new Error('Temporada é obrigatória');
      }
      if (!formData.batteriesConfig || formData.batteriesConfig.length === 0) {
        throw new Error('Pelo menos uma bateria deve ser configurada');
      }

      const categoryData: CategoryData = {
        name: formData.name.trim(),
        ballast: formData.ballast.trim(),
        maxPilots: parseInt(formData.maxPilots),
        batteriesConfig: formData.batteriesConfig,
        minimumAge: parseInt(formData.minimumAge),
        seasonId: formData.seasonId
      };

      if (isEditMode && categoryId) {
        await CategoryService.update(categoryId, categoryData);
      } else {
        await createCategory(categoryData);
      }

      setSaveSuccessful(true);
      setHasUnsavedChanges(false);
      navigate(`/championship/${championshipId}?tab=categories`);
    } catch (err: any) {
      console.error('Error saving category:', err);
      setShowErrorAlert(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    clearError();
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

  // No active seasons available
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

  // Loading state
  if (isLoadingSeasons || isLoadingGridTypes || (isEditMode && isLoadingCategoryData)) {
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
            disabled: isLoading || isSaving
          },
          {
            label: (isLoading || isSaving) ? loadingLabel : submitLabel,
            onClick: () => {
              const form = document.getElementById('category-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            },
            variant: "default",
            disabled: isLoading || isSaving
          }
        ]}
      />

      {/* Alerts */}
      <div className="w-full px-6 mb-4">
        {showErrorAlert && error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro ao {isEditMode ? 'atualizar' : 'criar'} categoria</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCloseErrorAlert}
                className="h-auto p-1 ml-2"
              >
                ✕
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Form */}
      <div className="w-full px-6">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da categoria *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Categoria A"
                  maxLength={75}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Lastro */}
              <div className="space-y-2">
                <Label htmlFor="ballast">Lastro *</Label>
                <Input
                  id="ballast"
                  value={formData.ballast}
                  onChange={(e) => handleInputChange('ballast', e.target.value)}
                  placeholder="Ex: 75Kg"
                  maxLength={10}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Máximo de pilotos */}
              <div className="space-y-2">
                <Label htmlFor="maxPilots">Máximo de pilotos *</Label>
                <Input
                  id="maxPilots"
                  type="number"
                  min="1"
                  value={formData.maxPilots}
                  onChange={(e) => handleInputChange('maxPilots', e.target.value)}
                  placeholder="Ex: 20"
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Idade mínima */}
              <div className="space-y-2">
                <Label htmlFor="minimumAge">Idade mínima *</Label>
                <Input
                  id="minimumAge"
                  type="number"
                  min="1"
                  value={formData.minimumAge}
                  onChange={(e) => handleInputChange('minimumAge', e.target.value)}
                  placeholder="Ex: 18"
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Temporada */}
              <div className="space-y-2">
                <Label htmlFor="seasonId">Temporada *</Label>
                <Select
                  value={formData.seasonId}
                  onValueChange={(value) => handleInputChange('seasonId', value)}
                  disabled={isLoading || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma temporada" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Baterias */}
          <Card>
            <CardContent className="pt-6">
              <BatteriesConfigForm
                value={formData.batteriesConfig}
                onChange={handleBatteriesConfigChange}
                gridTypes={gridTypes}
                disabled={isLoading || isSaving}
              />
            </CardContent>
          </Card>
        </form>
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