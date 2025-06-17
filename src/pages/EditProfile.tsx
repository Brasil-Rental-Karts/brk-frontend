import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FormScreen } from "@/components/ui/FormScreen";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { 
  fetchCitiesByState, 
  states,
  City 
} from "@/utils/ibge";
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
import { formatDateForDisplay, formatDateToISO } from "@/utils/date";

export const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);

  const loadCities = useCallback(async (uf: string) => {
    const citiesData = await fetchCitiesByState(uf);
    setCities(citiesData);
  }, []);

  const handleFieldChange = useCallback(async (fieldId: string, value: any, _formData: any, formRef: any) => {
    if (fieldId === "state" && value) {
      await loadCities(value);
      if (formRef) {
        formRef.setValue("city", "");
      }
    }
  }, [loadCities]);

  const fetchData = useCallback(() => ProfileService.getMemberProfile(), []);

  const updateData = useCallback(
    (_id: string, data: any) => ProfileService.updateMemberProfile(data),
    []
  );

  const transformInitialData = useCallback((data: any) => {
    if (data.state) {
      loadCities(data.state);
    }
    return {
      ...data,
      email: user?.email || data?.email || "",
      gender: data?.gender !== null ? data?.gender?.toString() : "",
      experienceTime: data?.experienceTime !== null ? data?.experienceTime?.toString() : "",
      raceFrequency: data?.raceFrequency !== null ? data?.raceFrequency?.toString() : "",
      championshipParticipation: data?.championshipParticipation !== null ? data?.championshipParticipation?.toString() : "",
      competitiveLevel: data?.competitiveLevel !== null ? data?.competitiveLevel?.toString() : "",
      attendsEvents: data?.attendsEvents !== null ? data?.attendsEvents?.toString() : "",
      interestCategories: Array.isArray(data?.interestCategories) 
        ? data.interestCategories.map((cat: number) => cat.toString())
        : [],
      birthDate: formatDateForDisplay(data?.birthDate || ""),
      name: data?.name || "",
      nickName: data?.nickName || "",
      phone: data?.phone || "",
      city: data?.city || "",
      state: data?.state || "",
      teamName: data?.teamName || "",
      telemetryType: data?.telemetryType || "",
      preferredTrack: data?.preferredTrack || "",
      hasOwnKart: !!data?.hasOwnKart,
      isTeamMember: !!data?.isTeamMember,
      usesTelemetry: !!data?.usesTelemetry,
    };
  }, [user]);

  const transformSubmitData = (data: any) => {
    const processedData = {
      ...data,
      birthDate: formatDateToISO(data.birthDate),
      gender: data.gender !== "" ? parseInt(data.gender) : null,
      experienceTime: data.experienceTime !== "" ? parseInt(data.experienceTime) : null,
      raceFrequency: data.raceFrequency !== "" ? parseInt(data.raceFrequency) : null,
      championshipParticipation: data.championshipParticipation !== "" ? parseInt(data.championshipParticipation) : null,
      competitiveLevel: data.competitiveLevel !== "" ? parseInt(data.competitiveLevel) : null,
      attendsEvents: data.attendsEvents !== "" ? parseInt(data.attendsEvents) : null,
      interestCategories: Array.isArray(data.interestCategories) 
        ? data.interestCategories.map((cat: string) => parseInt(cat))
        : [],
      teamName: data.teamName || "",
      telemetryType: data.telemetryType || "",
      preferredTrack: data.preferredTrack || "",
    };

    if (processedData.birthDate === null) {
      delete processedData.birthDate;
    }
    return processedData;
  };

  const onSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  const onCancel = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
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
            mandatory: false,
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
  }, [cities, user?.email]);
  
  // This page doesn't have an ID in the URL, but it's an "edit" screen.
  // We pass a dummy ID to trigger the edit mode logic in useFormScreen.
  return (
    <FormScreen
      title="Editar Perfil"
      formId="profile-form"
      formConfig={formConfig}
      id="me" 
      fetchData={fetchData}
      updateData={updateData}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onFieldChange={handleFieldChange}
      successMessage="Perfil salvo com sucesso!"
      errorMessage="Erro ao salvar perfil. Tente novamente."
    />
  );
};

export default EditProfile; 