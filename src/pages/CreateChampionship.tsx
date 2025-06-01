import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { Button } from "@/components/ui/button";
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

export const CreateChampionship = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [currentState, setCurrentState] = useState<string>("");
  const [formRef, setFormRef] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
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
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas. Tem certeza que deseja sair?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load cities based on selected state
  const loadCities = async (uf: string) => {
    const citiesData = await fetchCitiesByState(uf);
    setCities(citiesData);
  };

  // Handle form changes
  const handleFormChange = (data: any) => {
    setHasUnsavedChanges(true);
    
    if (data.state && data.state !== currentState) {
      setCurrentState(data.state);
      loadCities(data.state);
    }
  };

  // Handle specific field changes
  const handleFieldChange = async (fieldId: string, value: any) => {
    setHasUnsavedChanges(true);
    
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
    setHasUnsavedChanges(false);
    
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

  const handleSubmit = (_data: any) => {
    // Check if there are any validation errors
    if (formRef) {
      const formState = formRef.formState;
      if (formState.errors && Object.keys(formState.errors).length > 0) {
        scrollToFirstError();
        return;
      }
    }
    
    // Mark as saved before navigation
    setHasUnsavedChanges(false);
    navigate('/dashboard');
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
      <div className="w-full py-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Criar Campeonato</h1>
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Alterações não salvas
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelClick}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="championship-form"
            >
              Salvar Campeonato
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-6" id="championship-form-container">
        <DynamicForm
          config={formConfig}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onFieldChange={handleFieldChange}
          onFormReady={setFormRef}
          submitLabel="Salvar Campeonato"
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterações Não Salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas que serão perdidas se continuar.
              <br />
              <strong>Deseja realmente sair sem salvar?</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelUnsavedChanges}
            >
              Continuar Editando
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmUnsavedChanges}
            >
              Sair Sem Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateChampionship; 