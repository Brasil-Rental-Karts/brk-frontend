import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Card, CardContent, CardHeader, CardTitle } from "brk-design-system";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "brk-design-system";
import { Alert, AlertTitle, AlertDescription } from "brk-design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import { StageService, CreateStageData } from "@/lib/services/stage.service";
import { SeasonService } from "@/lib/services/season.service";
import { CategoryService } from "@/lib/services/category.service";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { ScoringSystemService } from "@/lib/services/scoring-system.service";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { InputMask } from "@/components/ui/input-mask";

export const CreateStage = () => {
  const navigate = useNavigate();
  const { championshipId, stageId } = useParams<{ 
    championshipId: string; 
    stageId?: string; 
  }>();

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    kartodrome: "",
    kartodromeAddress: "",
    streamLink: "",
    seasonId: "",
    categoryIds: [] as string[],
    defaultGridTypeId: "",
    defaultScoringSystemId: "",
    doublePoints: false,
    briefing: "",
    briefingTime: ""
  });

  // UI states
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);


  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingStageData, setIsLoadingStageData] = useState(false);
  const [loadStageError, setLoadStageError] = useState<string | null>(null);

  // Options
  const [seasonOptions, setSeasonOptions] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [gridTypeOptions, setGridTypeOptions] = useState<any[]>([]);
  const [scoringSystemOptions, setScoringSystemOptions] = useState<any[]>([]);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingGridTypes, setIsLoadingGridTypes] = useState(true);
  const [isLoadingScoringSystems, setIsLoadingScoringSystems] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Determine if it's edit mode
  useEffect(() => {
    setIsEditMode(!!stageId);
    setHasUnsavedChanges(false);
  }, [stageId]);

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
          label: season.name,
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
        
        const options = gridTypesData.map(gridType => ({
          value: gridType.id,
          label: gridType.name,
          description: `${gridType.name}${gridType.isDefault ? ' (Padrão)' : ''}`
        }));
        
        setGridTypeOptions(options);
      } catch (err: any) {
        console.error('Error loading grid types:', err);
        setGridTypeOptions([]);
      } finally {
        setIsLoadingGridTypes(false);
      }
    };

    loadGridTypes();
  }, [championshipId]);

  // Load scoring systems
  useEffect(() => {
    const loadScoringSystems = async () => {
      if (!championshipId) return;

      try {
        setIsLoadingScoringSystems(true);
        const scoringSystemsData = await ScoringSystemService.getByChampionship(championshipId);
        
        const options = scoringSystemsData.map(system => ({
          value: system.id,
          label: system.name,
          description: `${system.name}${system.isDefault ? ' (Padrão)' : ''}`
        }));
        
        setScoringSystemOptions(options);
      } catch (err: any) {
        console.error('Error loading scoring systems:', err);
        setScoringSystemOptions([]);
      } finally {
        setIsLoadingScoringSystems(false);
      }
    };

    loadScoringSystems();
  }, [championshipId]);

  // Load categories when season changes
  const loadCategoriesBySeasonId = useCallback(async (seasonId: string) => {
    if (!seasonId) {
      setCategoryOptions([]);
      return;
    }

    try {
      setIsLoadingCategories(true);
      const categories = await CategoryService.getBySeasonId(seasonId);
      
      const options = categories.map(category => ({
        value: category.id,
        label: category.name,
        description: `${category.name} - Lastro: ${category.ballast} | Max: ${category.maxPilots} pilotos`
      }));
      
      setCategoryOptions(options);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setCategoryOptions([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Load stage data for edit mode
  useEffect(() => {
    const loadStageData = async () => {
      if (!isEditMode || !stageId) return;

      setIsLoadingStageData(true);
      setLoadStageError(null);

      try {
        const stage = await StageService.getById(stageId);
        
        // Load categories for the stage's season
        await loadCategoriesBySeasonId(stage.seasonId);
        
        // Format date from YYYY-MM-DD to DD/MM/YYYY
        const [year, month, day] = stage.date.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        
        const stageData = {
          name: stage.name,
          date: formattedDate,
          time: stage.time,
          kartodrome: stage.kartodrome,
          kartodromeAddress: stage.kartodromeAddress,
          streamLink: stage.streamLink || "",
          seasonId: stage.seasonId,
          categoryIds: stage.categoryIds,
          defaultGridTypeId: stage.defaultGridTypeId || "inherit",
          defaultScoringSystemId: stage.defaultScoringSystemId || "inherit",
          doublePoints: stage.doublePoints,
          briefing: stage.briefing || "",
          briefingTime: stage.briefingTime || ""
        };
        
        setInitialFormData(stageData);
        setFormData(stageData);
      } catch (err: any) {
        setLoadStageError(err.message || 'Erro ao carregar dados da etapa');
      } finally {
        setIsLoadingStageData(false);
      }
    };

    loadStageData();
  }, [isEditMode, stageId, loadCategoriesBySeasonId]);

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
        if (Array.isArray(val)) return JSON.stringify(val);
        return val.toString();
      };
      
      return normalizeValue(initialValue) !== normalizeValue(currentValue);
    });

    setHasUnsavedChanges(hasChanges);
  }, [initialFormData]);

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    checkForChanges(newFormData);

    // Special handling for season change
    if (field === 'seasonId' && value !== formData.seasonId) {
      // Clear category selection and load new categories
      newFormData.categoryIds = [];
      setFormData(newFormData);
      loadCategoriesBySeasonId(value);
    }
  }, [formData, checkForChanges, loadCategoriesBySeasonId]);

  // Handle category checkbox change
  const handleCategoryChange = useCallback((categoryId: string, checked: boolean) => {
    const newCategoryIds = checked 
      ? [...formData.categoryIds, categoryId]
      : formData.categoryIds.filter(id => id !== categoryId);
    
    handleInputChange('categoryIds', newCategoryIds);
  }, [formData.categoryIds, handleInputChange]);

  // Set initial form data for create mode
  useEffect(() => {
    if (!isEditMode && !isLoadingSeasons && !isLoadingGridTypes && !isLoadingScoringSystems && !initialFormData) {
      const defaultGridType = gridTypeOptions.find(gt => gt.label.includes('Padrão'))?.value || gridTypeOptions[0]?.value || "";
      const defaultScoringSystem = scoringSystemOptions.find(ss => ss.label.includes('Padrão'))?.value || scoringSystemOptions[0]?.value || "";
      
      const initialData = {
        name: "",
        date: "",
        time: "",
        kartodrome: "",
        kartodromeAddress: "",
        streamLink: "",
        seasonId: "",
        categoryIds: [],
        defaultGridTypeId: defaultGridType || "inherit",
        defaultScoringSystemId: defaultScoringSystem || "inherit",
        doublePoints: false,
        briefing: "",
        briefingTime: ""
      };
      
      setInitialFormData(initialData);
      setFormData(initialData);
    }
  }, [isEditMode, isLoadingSeasons, isLoadingGridTypes, isLoadingScoringSystems, gridTypeOptions, scoringSystemOptions, initialFormData]);

  // Handle cancel
  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(`/championship/${championshipId}?tab=etapas`);
      setShowUnsavedChangesDialog(true);
    } else {
      navigate(`/championship/${championshipId}?tab=etapas`);
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
    setError(null);

    try {
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = formData.date.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const stageData: CreateStageData = {
        name: formData.name,
        date: isoDate,
        time: formData.time,
        kartodrome: formData.kartodrome,
        kartodromeAddress: formData.kartodromeAddress,
        streamLink: formData.streamLink || undefined,
        seasonId: formData.seasonId,
        categoryIds: formData.categoryIds,
        defaultGridTypeId: (formData.defaultGridTypeId && formData.defaultGridTypeId !== 'inherit') ? formData.defaultGridTypeId : undefined,
        defaultScoringSystemId: (formData.defaultScoringSystemId && formData.defaultScoringSystemId !== 'inherit') ? formData.defaultScoringSystemId : undefined,
        doublePoints: formData.doublePoints,
        briefing: formData.briefing || undefined,
        briefingTime: formData.briefingTime || undefined
      };

      // Validate stage data
      const validationErrors = StageService.validateStageData(stageData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      if (isEditMode && stageId) {
        await StageService.update(stageId, stageData);
      } else {
        await StageService.create(stageData);
      }

      setSaveSuccessful(true);
      setHasUnsavedChanges(false);
      
      // Navigate back to championship page
      setTimeout(() => {
        navigate(`/championship/${championshipId}?tab=etapas`);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Erro ao salvar etapa');
      setShowErrorAlert(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    setError(null);
  };

  // Success state
  if (saveSuccessful) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Sucesso!"
          actions={[]}
        />
        <div className="w-full px-6">
          <Alert variant="success">
            <AlertTitle>Etapa salva com sucesso!</AlertTitle>
            <AlertDescription>Redirecionando para a lista de etapas...</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingSeasons || isLoadingGridTypes || isLoadingScoringSystems || (isEditMode && isLoadingStageData)) {
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
  if (isEditMode && loadStageError) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Erro"
          actions={[
            {
              label: "Voltar",
              onClick: () => navigate(`/championship/${championshipId}?tab=etapas`),
              variant: "outline"
            }
          ]}
        />
        <div className="w-full px-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar etapa</AlertTitle>
            <AlertDescription>{loadStageError}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const pageTitle = isEditMode ? "Editar Etapa" : "Criar Etapa";
  const submitLabel = isEditMode ? "Atualizar Etapa" : "Salvar Etapa";
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
            disabled: isSaving
          },
          {
            label: isSaving ? loadingLabel : submitLabel,
            onClick: () => {
              const form = document.getElementById('stage-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            },
            variant: "default",
            disabled: isSaving
          }
        ]}
      />

      {/* Alerts */}
      <div className="w-full px-6 mb-4">
        {showErrorAlert && error && (
          <Alert variant="destructive" dismissible onClose={handleCloseErrorAlert} className="mb-4">
            <AlertTitle>Erro ao {isEditMode ? 'atualizar' : 'criar'} etapa</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Form */}
      <div className="w-full px-6">
        <form id="stage-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da etapa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Etapa 1 - São Paulo"
                  maxLength={75}
                  disabled={isSaving}
                />
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                                 <InputMask
                   id="date"
                   mask="date"
                   value={formData.date}
                   onChange={(value) => handleInputChange('date', value)}
                   placeholder="DD/MM/AAAA"
                   disabled={isSaving}
                 />
              </div>

              {/* Hora */}
              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                                 <InputMask
                   id="time"
                   mask="time"
                   value={formData.time}
                   onChange={(value) => handleInputChange('time', value)}
                   placeholder="HH:MM"
                   disabled={isSaving}
                 />
              </div>

              {/* Kartódromo */}
              <div className="space-y-2">
                <Label htmlFor="kartodrome">Kartódromo *</Label>
                <Input
                  id="kartodrome"
                  value={formData.kartodrome}
                  onChange={(e) => handleInputChange('kartodrome', e.target.value)}
                  placeholder="Nome do kartódromo"
                  maxLength={100}
                  disabled={isSaving}
                />
              </div>

              {/* Endereço Completo */}
              <div className="space-y-2">
                <Label htmlFor="kartodromeAddress">Endereço Completo do Kartódromo *</Label>
                <Input
                  id="kartodromeAddress"
                  value={formData.kartodromeAddress}
                  onChange={(e) => handleInputChange('kartodromeAddress', e.target.value)}
                  placeholder="Endereço completo"
                  maxLength={200}
                  disabled={isSaving}
                />
              </div>

              {/* Link de transmissão */}
              <div className="space-y-2">
                <Label htmlFor="streamLink">Link de transmissão</Label>
                <Input
                  id="streamLink"
                  type="url"
                  value={formData.streamLink}
                  onChange={(e) => handleInputChange('streamLink', e.target.value)}
                  placeholder="https://..."
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Temporada e Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Temporada e Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Temporada */}
              <div className="space-y-2">
                <Label htmlFor="seasonId">Temporada *</Label>
                <Select
                  value={formData.seasonId}
                  onValueChange={(value) => handleInputChange('seasonId', value)}
                  disabled={isSaving}
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

              {/* Categorias */}
              {formData.seasonId && (
                <div className="space-y-2">
                  <Label>Categorias da temporada *</Label>
                  {isLoadingCategories ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : categoryOptions.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                      {categoryOptions.map((category) => (
                        <div key={category.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.value}`}
                            checked={formData.categoryIds.includes(category.value)}
                            onCheckedChange={(checked) => handleCategoryChange(category.value, !!checked)}
                            disabled={isSaving}
                          />
                          <Label htmlFor={`category-${category.value}`} className="text-sm">
                            {category.description}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada para esta temporada</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Grid */}
              <div className="space-y-2">
                <Label htmlFor="defaultGridTypeId">Tipo de Grid</Label>
                <Select
                  value={formData.defaultGridTypeId}
                  onValueChange={(value) => handleInputChange('defaultGridTypeId', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Herda da categoria" />
                  </SelectTrigger>
                                     <SelectContent>
                     <SelectItem value="inherit">Herda da categoria</SelectItem>
                     {gridTypeOptions.map((option) => (
                       <SelectItem key={option.value} value={option.value}>
                         {option.description}
                       </SelectItem>
                     ))}
                   </SelectContent>
                </Select>
              </div>

              {/* Tipo de pontuação */}
              <div className="space-y-2">
                <Label htmlFor="defaultScoringSystemId">Tipo de pontuação</Label>
                <Select
                  value={formData.defaultScoringSystemId}
                  onValueChange={(value) => handleInputChange('defaultScoringSystemId', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Herda da categoria" />
                  </SelectTrigger>
                                     <SelectContent>
                     <SelectItem value="inherit">Herda da categoria</SelectItem>
                     {scoringSystemOptions.map((option) => (
                       <SelectItem key={option.value} value={option.value}>
                         {option.description}
                       </SelectItem>
                     ))}
                   </SelectContent>
                </Select>
              </div>

              {/* Pontuação em dobro */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="doublePoints"
                  checked={formData.doublePoints}
                  onCheckedChange={(checked) => handleInputChange('doublePoints', !!checked)}
                  disabled={isSaving}
                />
                <Label htmlFor="doublePoints">Pontuação em dobro</Label>
              </div>
            </CardContent>
          </Card>

          {/* Briefing */}
          <Card>
            <CardHeader>
              <CardTitle>Briefing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Briefing */}
              <div className="space-y-2">
                <Label htmlFor="briefing">Briefing</Label>
                <Textarea
                  id="briefing"
                  value={formData.briefing}
                  onChange={(e) => handleInputChange('briefing', e.target.value)}
                  placeholder="Instruções e informações para os pilotos"
                  rows={4}
                  maxLength={2000}
                  disabled={isSaving}
                />
              </div>

              {/* Hora do briefing */}
              <div className="space-y-2">
                <Label htmlFor="briefingTime">Horário do Briefing</Label>
                                 <InputMask
                   id="briefingTime"
                   mask="time"
                   value={formData.briefingTime}
                   onChange={(value) => handleInputChange('briefingTime', value)}
                   placeholder="HH:MM"
                   disabled={isSaving}
                 />
              </div>
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