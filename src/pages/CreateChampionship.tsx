import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { validateDocument } from "@/utils/validation";
import { 
  fetchAddressByCEP, 
  isValidCEPFormat, 
  fetchCitiesByState, 
  states,
  City 
} from "@/utils/ibge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChampionship } from "@/hooks/use-championship";
import { ChampionshipData } from "@/lib/services/championship.service";
import { useChampionshipContext } from "@/contexts/ChampionshipContext";
import { PageHeader } from "@/components/ui/page-header";

export const CreateChampionship = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [currentState, setCurrentState] = useState<string>("");
  const [formRef, setFormRef] = useState<any>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { isLoading, error, createChampionship, clearError } = useChampionship();
  const { addChampionship } = useChampionshipContext();

  // Block navigation when there are unsaved changes (but not when save was successful or currently saving)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !saveSuccessful && !isSaving && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle blocked navigation
  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedChangesDialog(true);
      setPendingNavigation(blocker.location?.pathname || null);
    }
  }, [blocker]);

  // Handle beforeunload event (browser refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!saveSuccessful && !isSaving) {
        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas. Tem certeza que deseja sair?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveSuccessful, isSaving]);

  // Show error alert when error changes
  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
    }
  }, [error]);

  // Load cities based on selected state
  const loadCities = async (uf: string) => {
    const citiesData = await fetchCitiesByState(uf);
    setCities(citiesData);
  };

  // Handle form changes
  const handleFormChange = (data: any) => {
    if (data.state && data.state !== currentState) {
      setCurrentState(data.state);
      loadCities(data.state);
    }
  };

  // Handle specific field changes
  const handleFieldChange = async (fieldId: string, value: any) => {
    if (fieldId === "cep" && value && isValidCEPFormat(value)) {
      const addressData = await fetchAddressByCEP(value);
      if (addressData && formRef) {
        // Atualiza os campos automaticamente
        formRef.setValue("state", addressData.uf);
        formRef.setValue("fullAddress", addressData.logradouro);
        
        // Carrega as cidades do estado encontrado
        await loadCities(addressData.uf);
        
        // Define a cidade após carregar as cidades
        setTimeout(() => {
          formRef.setValue("city", addressData.localidade);
        }, 500);
      }
    }
  };

  // Scroll to first error field
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

  // Handle cancel - navigate directly to dashboard
  const handleCancelClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Handle unsaved changes dialog
  const handleConfirmUnsavedChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    
    if (pendingNavigation) {
      blocker.proceed?.();
    }
    
    setPendingNavigation(null);
  }, [blocker, pendingNavigation]);

  const handleCancelUnsavedChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    blocker.reset?.();
    setPendingNavigation(null);
  }, [blocker]);

  const handleSubmit = async (data: any) => {
    // Check if there are any validation errors
    if (formRef) {
      const formState = formRef.formState;
      if (formState.errors && Object.keys(formState.errors).length > 0) {
        scrollToFirstError();
        return;
      }
    }

    // Clear any previous errors and mark as saved (removes "Alterações não salvas" indicator)
    // Also set saving state to disable blocker
    clearError();
    setShowErrorAlert(false);
    setIsSaving(true);

    // Prepare championship data
    const championshipData: ChampionshipData = {
      name: data.name,
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      personType: parseInt(data.personType || '0'),
      document: data.document,
      socialReason: data.socialReason || '',
      cep: data.cep,
      state: data.state,
      city: data.city,
      fullAddress: data.fullAddress,
      number: data.number,
      complement: data.complement || '',
      isResponsible: data.isResponsible !== false, // Default to true
      responsibleName: data.responsibleName || '',
      responsiblePhone: data.responsiblePhone || ''
    };

    try {
      const championship = await createChampionship(championshipData);
      
      if (championship) {
        // Success - add to context and navigate directly to dashboard
        // Use replace to avoid history stack and ensure blocker doesn't interfere
        addChampionship(championship);
        setSaveSuccessful(true);
        navigate('/dashboard', { replace: true });
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
        section: "Sobre o Campeonato",
        detail: "Informações visíveis aos usuários",
        fields: [
          {
            id: "name",
            name: "Nome do campeonato",
            type: "input",
            mandatory: true,
            max_char: 90,
            placeholder: "Ex: Copa de Kart São Paulo 2024"
          },
          {
            id: "shortDescription",
            name: "Descrição curta do campeonato",
            type: "textarea",
            mandatory: false,
            max_char: 165,
            placeholder: "Breve descrição que aparecerá nas listagens e buscas"
          },
          {
            id: "fullDescription",
            name: "Descrição completa do campeonato",
            type: "textarea",
            mandatory: false,
            max_char: 1000,
            placeholder: "Descrição detalhada com regulamento, categorias, premiação, etc."
          }
        ]
      },
      {
        section: "Dados Gerais",
        detail: "Informações legais do campeonato",
        fields: [
          {
            id: "personType",
            name: "Tipo de pessoa",
            type: "select",
            mandatory: true,
            options: [
              { value: "0", description: "Pessoa Física" },
              { value: "1", description: "Pessoa Jurídica" }
            ]
          },
          {
            id: "document",
            name: "Documento",
            type: "inputMask",
            mandatory: true,
            mask: "cpf",
            placeholder: "000.000.000-00",
            customValidation: {
              validate: (value: string, formData: any) => {
                return validateDocument(value, formData.personType || "0");
              },
              errorMessage: "Documento inválido"
            }
          },
          {
            id: "socialReason",
            name: "Razão social",
            type: "input",
            mandatory: true,
            placeholder: "Nome oficial da empresa conforme CNPJ",
            conditionalField: {
              dependsOn: "personType",
              showWhen: "1"
            }
          },
          {
            id: "cep",
            name: "CEP",
            type: "inputMask",
            mandatory: true,
            mask: "cep",
            placeholder: "00000-000 (preencherá endereço automaticamente)"
          },
          {
            id: "state",
            name: "Estado",
            type: "select",
            mandatory: true,
            options: states.map(state => ({ value: state, description: state })),
            inline: true,
            inlineGroup: "location"
          },
          {
            id: "city",
            name: "Cidade",
            type: "select",
            mandatory: true,
            options: cities.map(city => ({ value: city.nome, description: city.nome })),
            inline: true,
            inlineGroup: "location"
          },
          {
            id: "fullAddress",
            name: "Endereço completo",
            type: "input",
            mandatory: true,
            placeholder: "Rua, avenida ou logradouro completo"
          },
          {
            id: "number",
            name: "Número",
            type: "input",
            mandatory: true,
            placeholder: "Número do endereço",
            inline: true,
            inlineGroup: "address"
          },
          {
            id: "complement",
            name: "Complemento",
            type: "input",
            mandatory: false,
            placeholder: "Apto, sala, bloco (opcional)",
            inline: true,
            inlineGroup: "address"
          },
          {
            id: "isResponsible",
            name: "Sou o responsável do campeonato",
            type: "checkbox",
            mandatory: false
          },
          {
            id: "responsibleName",
            name: "Nome do responsável",
            type: "input",
            mandatory: true,
            placeholder: "Nome completo da pessoa responsável",
            conditionalField: {
              dependsOn: "isResponsible",
              showWhen: false
            }
          },
          {
            id: "responsiblePhone",
            name: "Celular do responsável",
            type: "inputMask",
            mandatory: true,
            mask: "phone",
            placeholder: "(11) 99999-9999",
            conditionalField: {
              dependsOn: "isResponsible",
              showWhen: false
            }
          }
        ]
      }
    ];

    setFormConfig(config);
  }, [cities]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Criar Campeonato"
        actions={[
          {
            label: "Cancelar",
            onClick: handleCancelClick,
            variant: "outline",
            disabled: isLoading
          },
          {
            label: isLoading ? "Salvando..." : "Salvar Campeonato",
            onClick: () => {
              // Trigger form submission
              const form = document.getElementById('championship-form') as HTMLFormElement;
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
            <AlertTitle>Erro ao criar campeonato</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <div className="w-full px-6" id="championship-form-container">
        <DynamicForm
          config={formConfig}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onFieldChange={handleFieldChange}
          onFormReady={setFormRef}
          submitLabel={isLoading ? "Salvando..." : "Salvar Campeonato"}
          cancelLabel="Cancelar"
          showButtons={true}
          className="space-y-6"
          formId="championship-form"
          initialValues={{
            personType: "0", // Pessoa Física por padrão
            isResponsible: true // Sou responsável pelo campeonato marcado por padrão
          }}
        />
      </div>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelUnsavedChanges}>
              Continuar editando
            </Button>
            <Button variant="destructive" onClick={handleConfirmUnsavedChanges}>
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateChampionship; 