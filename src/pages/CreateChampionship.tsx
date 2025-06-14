import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { Button } from "brk-design-system";
import { Alert, AlertTitle, AlertDescription } from "brk-design-system";
import { validateDocument } from "@/utils/validation";
import { 
  fetchAddressByCEP, 
  isValidCEPFormat, 
  fetchCitiesByState, 
  states,
  City 
} from "@/utils/ibge";
import { 
  fetchCompanyByCNPJ, 
  isValidCNPJFormat, 
  extractMainPhone, 
  extractMainEmail,
  formatFullAddress 
} from "@/utils/cnpj";
import { masks } from "@/utils/masks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import { ChampionshipData } from "@/lib/services/championship.service";
import { useChampionshipContext } from "@/contexts/ChampionshipContext";
import { PageHeader } from "@/components/ui/page-header";
import { useCreateChampionship } from "@/hooks/use-create-championship";

// Função auxiliar para converter data DD/MM/AAAA para formato ISO
const convertDateToISO = (dateString: string): string | undefined => {
  if (!dateString || dateString.length < 10) return undefined;
  
  const [day, month, year] = dateString.split('/');
  if (!day || !month || !year) return undefined;
  
  // Criar data no formato ISO (AAAA-MM-DD)
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  // Validar se a data é válida
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return undefined;
  
  return isoDate;
};

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
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { isLoading, error, createChampionship, clearError } = useCreateChampionship();
  const { addChampionship } = useChampionshipContext();

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

  // Block navigation when there are unsaved changes (but not when save was successful or currently saving)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && !saveSuccessful && !isSaving && currentLocation.pathname !== nextLocation.pathname
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
      if (hasUnsavedChanges && !saveSuccessful && !isSaving) {
        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas. Tem certeza que deseja sair?";
        return e.returnValue;
      }
    };

    if (hasUnsavedChanges && !saveSuccessful && !isSaving) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, saveSuccessful, isSaving]);

  // Show error alert when error changes
  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
    }
  }, [error]);

  // Initialize empty form data as "saved state"
  useEffect(() => {
    const emptyFormData = {
      name: "",
      shortDescription: "",
      fullDescription: "",
      personType: "0",
      document: "",
      socialReason: "",
      cep: "",
      state: "",
      city: "",
      fullAddress: "",
      number: "",
      complement: "",
      isResponsible: true,
      responsibleName: "",
      responsiblePhone: "",
      sponsors: []
    };
    setInitialFormData(emptyFormData);
    setHasUnsavedChanges(false);
  }, []);

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
    
    // Check for changes whenever form data changes
    checkForChanges(data);
  };

  // Handle specific field changes
  const handleFieldChange = async (fieldId: string, value: any) => {
    if (fieldId === "cep" && value && isValidCEPFormat(value)) {
      const addressData = await fetchAddressByCEP(value);
      if (addressData && formRef) {
        // Atualiza os campos automaticamente
        formRef.setValue("state", addressData.uf);
        formRef.setValue("fullAddress", addressData.logradouro);
        formRef.setValue("province", addressData.bairro); // Adiciona o bairro
        
        // Remove erros dos campos que serão preenchidos automaticamente
        formRef.clearErrors(["state", "city", "fullAddress", "province"]);
        
        // Carrega as cidades do estado encontrado
        await loadCities(addressData.uf);
        
        // Define a cidade após carregar as cidades
        setTimeout(() => {
          formRef.setValue("city", addressData.localidade);
        }, 500);
      }
    }
    
    if (fieldId === "document" && value && formRef) {
      // Verifica se é pessoa jurídica e se o documento é um CNPJ válido
      const currentFormData = formRef.getValues();
      const personType = currentFormData.personType;
      
      if (personType === "1" && isValidCNPJFormat(value)) {
        const companyData = await fetchCompanyByCNPJ(value);
        if (companyData && formRef) {
          // Preenche automaticamente os campos com os dados da empresa
          formRef.setValue("socialReason", companyData.company.name);
          
          // Preenche dados de endereço
          formRef.setValue("cep", masks.cep(companyData.address.zip));
          formRef.setValue("state", companyData.address.state);
          formRef.setValue("city", companyData.address.city);
          formRef.setValue("fullAddress", formatFullAddress(companyData.address));
          formRef.setValue("number", companyData.address.number);
          formRef.setValue("province", companyData.address.district); // Adiciona o bairro
          
          // Preenche telefone se não for responsável
          const mainPhone = extractMainPhone(companyData.phones);
          if (mainPhone && !currentFormData.isResponsible) {
            formRef.setValue("responsiblePhone", mainPhone);
          }
          
          // Preenche e-mail se não for responsável
          const mainEmail = extractMainEmail(companyData.emails);
          if (mainEmail && !currentFormData.isResponsible) {
            formRef.setValue("responsibleEmail", mainEmail);
          }
          
          // Remove erros dos campos que foram preenchidos automaticamente
          formRef.clearErrors([
            "socialReason", 
            "cep", 
            "state", 
            "city", 
            "fullAddress", 
            "number",
            "province",
            "responsiblePhone",
            "responsibleEmail"
          ]);
          
          // Carrega as cidades do estado encontrado
          await loadCities(companyData.address.state);
        }
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
    setHasUnsavedChanges(false);
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
      championshipImage: data.championshipImage || '',
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
      province: data.province || '', // Bairro
      isResponsible: data.isResponsible !== false, // Default to true
      responsibleName: data.responsibleName || '',
      responsiblePhone: data.responsiblePhone || '',
      responsibleEmail: data.responsibleEmail || '', // E-mail do responsável
      responsibleBirthDate: data.responsibleBirthDate ? convertDateToISO(data.responsibleBirthDate) : undefined, // Data de nascimento do responsável
      companyType: data.companyType || undefined, // Tipo de empresa (pessoa jurídica)
      incomeValue: data.incomeValue ? parseFloat(data.incomeValue.replace(/[^\d]/g, '')) / 100 : undefined, // Faturamento/Renda mensal
      sponsors: data.sponsors || []
    };

    try {
      const championship = await createChampionship(championshipData);
      
      if (championship) {
        // Success - add to context and navigate to the new championship page
        // Use replace to avoid history stack and ensure blocker doesn't interfere
        addChampionship(championship);
        setSaveSuccessful(true);
        setHasUnsavedChanges(false); // Reset unsaved changes after successful save
        navigate(`/championship/${championship.id}`, { replace: true });
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
            id: "championshipImage",
            name: "Imagem do campeonato",
            type: "file",
            mandatory: false,
            placeholder: "Faça upload da imagem ou insira uma URL",
            accept: "image/*",
            maxSize: 5,
            showPreview: true
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
            id: "companyType",
            name: "Tipo de empresa",
            type: "select",
            mandatory: true,
            options: [
              { value: "MEI", description: "MEI - Microempreendedor Individual" },
              { value: "LIMITED", description: "Limited - Sociedade Limitada" },
              { value: "INDIVIDUAL", description: "Individual - Empresário Individual" },
              { value: "ASSOCIATION", description: "Association - Associação" }
            ],
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
            placeholder: "00000-000"
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
            placeholder: "Rua, avenida ou logradouro completo",
            inline: true,
            inlineGroup: "addressFull"
          },
          {
            id: "province",
            name: "Bairro",
            type: "input",
            mandatory: true,
            placeholder: "Nome do bairro",
            inline: true,
            inlineGroup: "addressFull"
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
            id: "incomeValue",
            name: "Faturamento/Renda mensal",
            type: "inputMask",
            mandatory: true,
            mask: "currency",
            placeholder: "R$ 0,00"
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
          },
          {
            id: "responsibleEmail",
            name: "E-mail do responsável",
            type: "input",
            mandatory: true,
            placeholder: "email@exemplo.com",
            conditionalField: {
              dependsOn: "isResponsible",
              showWhen: false
            }
          },
          {
            id: "responsibleBirthDate",
            name: "Data de nascimento do responsável",
            type: "inputMask",
            mandatory: true,
            mask: "date",
            placeholder: "DD/MM/AAAA",
            conditionalField: {
              dependsOn: "isResponsible",
              showWhen: false
            }
          }
        ]
      },
      {
        section: "Patrocinadores",
        detail: "Gerenciar patrocinadores do campeonato",
        fields: [
          {
            id: "sponsors",
            name: "Lista de patrocinadores",
            type: "sponsor-list",
            mandatory: false,
            placeholder: "Adicione patrocinadores ao seu campeonato"
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
            isResponsible: true, // Sou responsável pelo campeonato marcado por padrão
            sponsors: [] // Array vazio de sponsors
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