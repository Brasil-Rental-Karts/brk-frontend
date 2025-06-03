import { useState, useEffect, useCallback } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
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
import { ProfileService } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import {
  attendsEventsOptions,
  competitiveLevelOptions,
  championshipParticipationOptions,
  raceFrequencyOptions,
  kartExperienceYearsOptions,
  genderOptions,
  interestCategoryOptions
} from "@/lib/enums/profile";
import { PageHeader } from "@/components/ui/page-header";

export const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [currentState, setCurrentState] = useState<string>("");
  const [formRef, setFormRef] = useState<any>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [shouldBlock, setShouldBlock] = useState(false);

  // Block navigation when there are unsaved changes (but not when save was successful or currently saving)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      shouldBlock && !saveSuccessful && !isSaving && currentLocation.pathname !== nextLocation.pathname
  );

  // Update shouldBlock based on conditions
  useEffect(() => {
    setShouldBlock(!saveSuccessful && !isSaving);
  }, [saveSuccessful, isSaving]);

  // Cleanup blocker on unmount
  useEffect(() => {
    return () => {
      setShouldBlock(false);
    };
  }, []);

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
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas. Tem certeza que deseja sair?";
        return e.returnValue;
      }
    };

    if (shouldBlock) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlock]);

  // Show error alert when error changes
  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
    }
  }, [error]);

  // Load user profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        console.log('Tentando carregar perfil do usuário...', { user });
        const data = await ProfileService.getMemberProfile();
        console.log('Dados do perfil carregados com sucesso:', data);
        setProfileData(data);
        
        // Load cities if state is available
        if (data.state) {
          setCurrentState(data.state);
          await loadCities(data.state);
        }
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err);
        console.error('Status do erro:', err.response?.status);
        console.error('Dados do erro:', err.response?.data);
        
        if (err.response?.status === 401) {
          setError('Você precisa estar logado para acessar esta página. Redirecionando para o login...');
          setTimeout(() => {
            navigate('/auth/login');
          }, 3000);
        } else {
          setError(err.message || 'Erro ao carregar dados do perfil');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfileData();
    } else {
      console.log('Usuário não encontrado, redirecionando para login...');
      navigate('/auth/login');
    }
  }, [user, navigate]);

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
    if (fieldId === "state" && value && value !== currentState) {
      setCurrentState(value);
      await loadCities(value);
      // Clear city when state changes
      if (formRef) {
        formRef.setValue("city", "");
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
    setShouldBlock(false);
    navigate('/dashboard');
  }, [navigate]);

  // Handle unsaved changes dialog
  const handleConfirmUnsavedChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    setShouldBlock(false);
    
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

    // Clear any previous errors and mark as saved
    setError(null);
    setShowErrorAlert(false);
    setIsSaving(true);

    try {
      // Helper function to validate and format date
      const formatDateForSubmission = (dateStr: string) => {
        if (!dateStr || dateStr.trim() === "") return null;
        
        // Check if it's in DD/MM/YYYY format
        const ddmmyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateStr.match(ddmmyyyyPattern);
        
        if (match) {
          const [, day, month, year] = match;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          // Validate if the date is valid
          if (date.getDate() == parseInt(day) && 
              date.getMonth() == parseInt(month) - 1 && 
              date.getFullYear() == parseInt(year)) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        return null; // Invalid date
      };

      // Convert string values back to numbers for numeric enums and handle special cases
      const processedData = {
        ...data,
        // Handle date field - only include if valid
        birthDate: formatDateForSubmission(data.birthDate),
        gender: data.gender !== "" ? parseInt(data.gender) : null,
        experienceTime: data.experienceTime !== "" ? parseInt(data.experienceTime) : null,
        raceFrequency: data.raceFrequency !== "" ? parseInt(data.raceFrequency) : null,
        championshipParticipation: data.championshipParticipation !== "" ? parseInt(data.championshipParticipation) : null,
        competitiveLevel: data.competitiveLevel !== "" ? parseInt(data.competitiveLevel) : null,
        attendsEvents: data.attendsEvents !== "" ? parseInt(data.attendsEvents) : null,
        // Handle multiple interest categories
        interestCategories: Array.isArray(data.interestCategories) 
          ? data.interestCategories.map((cat: string) => parseInt(cat))
          : [],
      };

      // Remove null birthDate from submission if invalid
      if (processedData.birthDate === null) {
        delete processedData.birthDate;
      }

      await ProfileService.updateMemberProfile(processedData);
      
      // Success - stay on the page and show success message
      setSaveSuccessful(true);
      setShouldBlock(false);
      
      // Show success message temporarily
      setTimeout(() => {
        setSaveSuccessful(false);
      }, 3000);
      
    } catch (err: any) {
      // Error occurred - restore unsaved changes indicator and stop saving
      setError(err.message || 'Erro ao salvar perfil. Tente novamente.');
      setIsSaving(false);
      scrollToFirstError();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle alert close
  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    setError(null);
  };

  // Create form configuration
  useEffect(() => {
    if (!profileData) return;

    const config: FormSectionConfig[] = [
      {
        section: "Dados Pessoais",
        detail: "Informações básicas do piloto",
        fields: [
          {
            id: "name",
            name: "Nome",
            type: "input",
            mandatory: true,
            max_char: 100,
            placeholder: "Digite seu nome completo"
          },
          {
            id: "nickName",
            name: "Apelido",
            type: "input",
            mandatory: true,
            max_char: 100,
            placeholder: "Digite seu apelido ou nome de piloto"
          },
          {
            id: "email",
            name: "Email",
            type: "input",
            mandatory: true,
            readonly: true,
            disabled: true,
            placeholder: user?.email || "Email não disponível"
          },
          {
            id: "phone",
            name: "Celular",
            type: "inputMask",
            mandatory: false,
            mask: "phone",
            placeholder: "(11) 99999-9999"
          },
          {
            id: "birthDate",
            name: "Data de nascimento",
            type: "inputMask",
            mandatory: false,
            mask: "date",
            placeholder: "DD/MM/AAAA"
          },
          {
            id: "gender",
            name: "Gênero",
            type: "select",
            mandatory: false,
            options: genderOptions.map(option => ({ 
              value: option.value.toString(), 
              description: option.label 
            }))
          },
          {
            id: "state",
            name: "Estado",
            type: "select",
            mandatory: false,
            options: states.map(state => ({ value: state, description: state })),
            inline: true,
            inlineGroup: "location"
          },
          {
            id: "city",
            name: "Cidade",
            type: "select",
            mandatory: false,
            options: cities.map(city => ({ value: city.nome, description: city.nome })),
            inline: true,
            inlineGroup: "location"
          }
        ]
      },
      {
        section: "Experiência no Kart",
        detail: "Informações sobre sua experiência com kart",
        fields: [
          {
            id: "experienceTime",
            name: "Há quanto tempo anda de kart?",
            type: "select",
            mandatory: false,
            options: kartExperienceYearsOptions.map(option => ({ 
              value: option.value.toString(), 
              description: option.label 
            }))
          },
          {
            id: "raceFrequency",
            name: "Com que frequência corre?",
            type: "select",
            mandatory: false,
            options: raceFrequencyOptions.map(option => ({ 
              value: option.value.toString(), 
              description: option.label 
            }))
          },
          {
            id: "championshipParticipation",
            name: "Já participou de campeonatos?",
            type: "select",
            mandatory: false,
            options: championshipParticipationOptions.map(option => ({ 
              value: option.value.toString(), 
              description: option.label 
            }))
          },
          {
            id: "competitiveLevel",
            name: "Como você classificaria seu nível no kart?",
            type: "select",
            mandatory: false,
            options: competitiveLevelOptions.map(option => ({ 
              value: option.value.toString(), 
              description: option.label 
            }))
          }
        ]
      },
      {
        section: "Estrutura e Interesse",
        detail: "Informações sobre equipamentos e preferências",
        fields: [
          {
            id: "hasOwnKart",
            name: "Possui Kart próprio?",
            type: "checkbox",
            mandatory: false
          },
          {
            id: "isTeamMember",
            name: "Participa de alguma equipe?",
            type: "checkbox",
            mandatory: false
          },
          {
            id: "teamName",
            name: "Nome da equipe",
            type: "input",
            mandatory: false,
            max_char: 100,
            placeholder: "Nome da sua equipe",
            conditionalField: {
              dependsOn: "isTeamMember",
              showWhen: true
            }
          },
          {
            id: "usesTelemetry",
            name: "Utiliza telemetria?",
            type: "checkbox",
            mandatory: false
          },
          {
            id: "telemetryType",
            name: "Tipo de telemetria",
            type: "input",
            mandatory: false,
            max_char: 100,
            placeholder: "Ex: AiM, MoTeC, etc.",
            conditionalField: {
              dependsOn: "usesTelemetry",
              showWhen: true
            }
          },
          {
            id: "attendsEvents",
            name: "Disposto a participar de eventos em outras cidades?",
            type: "select",
            mandatory: false,
            options: attendsEventsOptions.map(option => ({ 
              value: option.value.toString(), 
              description: option.label 
            }))
          },
          {
            id: "interestCategories",
            name: "Quais categorias mais te interessam?",
            type: "checkbox-group",
            mandatory: false,
            options: interestCategoryOptions.map(option => ({ 
              value: option.value.toString(), 
              description: option.label 
            }))
          },
          {
            id: "preferredTrack",
            name: "Kartódromo preferido",
            type: "input",
            mandatory: false,
            max_char: 100,
            placeholder: "Nome do seu kartódromo preferido"
          }
        ]
      }
    ];

    setFormConfig(config);
  }, [cities, profileData, user?.email]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do perfil...</p>
        </div>
      </div>
    );
  }

  // Show error state if there was an error and no profile data
  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao carregar perfil</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Editar Perfil"
        actions={[
          {
            label: "Cancelar",
            onClick: handleCancelClick,
            variant: "outline",
            disabled: isSaving
          },
          {
            label: isSaving ? "Salvando..." : "Salvar Perfil",
            onClick: () => {
              // Trigger form submission
              const form = document.getElementById('profile-form') as HTMLFormElement;
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
        {saveSuccessful && (
          <Alert variant="default" className="mb-4 border-green-200 bg-green-50 text-green-800">
            <AlertTitle>Perfil salvo com sucesso!</AlertTitle>
            <AlertDescription>Suas alterações foram salvas e estão atualizadas.</AlertDescription>
          </Alert>
        )}
        {showErrorAlert && error && (
          <Alert variant="destructive" hasCloseButton onClose={handleCloseErrorAlert} className="mb-4">
            <AlertTitle>Erro ao salvar perfil</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <div className="w-full px-6" id="profile-form-container">
        <DynamicForm
          config={formConfig}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onFieldChange={handleFieldChange}
          onFormReady={setFormRef}
          submitLabel={isSaving ? "Salvando..." : "Salvar Perfil"}
          cancelLabel="Cancelar"
          showButtons={true}
          className="space-y-6"
          formId="profile-form"
          initialValues={{
            ...profileData,
            email: user?.email || profileData?.email || "",
            // Convert numeric values to strings for the form
            gender: profileData?.gender !== null ? profileData?.gender?.toString() : "",
            experienceTime: profileData?.experienceTime !== null ? profileData?.experienceTime?.toString() : "",
            raceFrequency: profileData?.raceFrequency !== null ? profileData?.raceFrequency?.toString() : "",
            championshipParticipation: profileData?.championshipParticipation !== null ? profileData?.championshipParticipation?.toString() : "",
            competitiveLevel: profileData?.competitiveLevel !== null ? profileData?.competitiveLevel?.toString() : "",
            attendsEvents: profileData?.attendsEvents !== null ? profileData?.attendsEvents?.toString() : "",
            // Handle multiple interest categories as array
            interestCategories: Array.isArray(profileData?.interestCategories) 
              ? profileData.interestCategories.map((cat: number) => cat.toString())
              : [],
            // Format birth date for display (DD/MM/YYYY)
            birthDate: profileData?.birthDate ? (() => {
              const date = new Date(profileData.birthDate);
              if (!isNaN(date.getTime())) {
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
              }
              return "";
            })() : "",
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

export default EditProfile; 