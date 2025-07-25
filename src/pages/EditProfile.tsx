import { Button } from "brk-design-system";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DeleteAccountModal } from "@/components/profile/DeleteAccountModal";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { FormScreen } from "@/components/ui/FormScreen";
import { useAuth } from "@/contexts/AuthContext";
import {
  attendsEventsOptions,
  championshipParticipationOptions,
  competitiveLevelOptions,
  genderOptions,
  interestCategoryOptions,
  kartExperienceYearsOptions,
  raceFrequencyOptions,
} from "@/lib/enums/profile";
import { ProfileService } from "@/lib/services";
import { formatDateForDisplay, formatDateToISO } from "@/utils/date";
import { City, fetchCitiesByState, states } from "@/utils/ibge";

export const EditProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadCities = useCallback(async (uf: string) => {
    const citiesData = await fetchCitiesByState(uf);
    setCities(citiesData);
  }, []);

  const handleFieldChange = useCallback(
    async (fieldId: string, value: any, _formData: any, formRef: any) => {
      if (fieldId === "state" && value) {
        await loadCities(value);
        if (formRef) {
          formRef.setValue("city", "");
        }
      }
    },
    [loadCities],
  );

  const fetchData = useCallback(() => ProfileService.getMemberProfile(), []);

  const updateData = useCallback(
    (_id: string, data: any) => ProfileService.updateMemberProfile(data),
    [],
  );

  const handleDeleteAccount = async () => {
    try {
      await ProfileService.deleteAccount();
      logout();
      navigate("/login", { replace: true });
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      // The modal will show its own error message
      throw error;
    }
  };

  const transformInitialData = useCallback(
    (data: any) => {
      if (data.state) {
        loadCities(data.state);
      }
      return {
        ...data,
        email: user?.email || data?.email || "",
        gender: data?.gender !== null ? data?.gender?.toString() : "",
        experienceTime:
          data?.experienceTime !== null ? data?.experienceTime?.toString() : "",
        raceFrequency:
          data?.raceFrequency !== null ? data?.raceFrequency?.toString() : "",
        championshipParticipation:
          data?.championshipParticipation !== null
            ? data?.championshipParticipation?.toString()
            : "",
        competitiveLevel:
          data?.competitiveLevel !== null
            ? data?.competitiveLevel?.toString()
            : "",
        attendsEvents:
          data?.attendsEvents !== null ? data?.attendsEvents?.toString() : "",
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
        hasOwnKart: data?.hasOwnKart?.toString(),
        isTeamMember: data?.isTeamMember?.toString(),
        usesTelemetry: data?.usesTelemetry?.toString(),
      };
    },
    [user, loadCities],
  );

  const transformSubmitData = (data: any) => {
    const processedData = {
      ...data,
      birthDate: formatDateToISO(data.birthDate),
      gender: data.gender !== "" ? parseInt(data.gender) : null,
      experienceTime:
        data.experienceTime !== "" ? parseInt(data.experienceTime) : null,
      raceFrequency:
        data.raceFrequency !== "" ? parseInt(data.raceFrequency) : null,
      championshipParticipation:
        data.championshipParticipation !== ""
          ? parseInt(data.championshipParticipation)
          : null,
      competitiveLevel:
        data.competitiveLevel !== "" ? parseInt(data.competitiveLevel) : null,
      attendsEvents:
        data.attendsEvents !== "" ? parseInt(data.attendsEvents) : null,
      interestCategories: Array.isArray(data.interestCategories)
        ? data.interestCategories.map((cat: string) => parseInt(cat))
        : [],
      teamName: data.teamName || "",
      telemetryType: data.telemetryType || "",
      preferredTrack: data.preferredTrack || "",
      hasOwnKart: data.hasOwnKart === "true",
      isTeamMember: data.isTeamMember === "true",
      usesTelemetry: data.usesTelemetry === "true",
    };

    if (processedData.birthDate === null) {
      delete processedData.birthDate;
    }
    return processedData;
  };

  const onSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  const onCancel = () => {
    navigate("/dashboard");
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
            placeholder: "Digite seu nome completo",
          },
          {
            id: "nickName",
            name: "Apelido",
            type: "input",
            mandatory: false,
            max_char: 100,
            placeholder: "Digite seu apelido ou nome de piloto",
          },
          {
            id: "email",
            name: "Email",
            type: "input",
            mandatory: true,
            readonly: true,
            disabled: true,
            placeholder: user?.email || "Email não disponível",
          },
          {
            id: "phone",
            name: "Celular",
            type: "inputMask",
            mandatory: false,
            mask: "phone",
            placeholder: "(11) 99999-9999",
          },
          {
            id: "birthDate",
            name: "Data de nascimento",
            type: "inputMask",
            mandatory: false,
            mask: "date",
            placeholder: "DD/MM/AAAA",
          },
          {
            id: "gender",
            name: "Gênero",
            type: "select",
            mandatory: false,
            options: genderOptions.map((option) => ({
              value: option.value.toString(),
              description: option.label,
            })),
          },
          {
            id: "state",
            name: "Estado",
            type: "select",
            mandatory: false,
            options: states.map((state) => ({
              value: state,
              description: state,
            })),
            inline: true,
            inlineGroup: "location",
          },
          {
            id: "city",
            name: "Cidade",
            type: "select",
            mandatory: false,
            options: cities.map((city) => ({
              value: city.nome,
              description: city.nome,
            })),
            inline: true,
            inlineGroup: "location",
          },
        ],
      },
      {
        section: "Experiência no Kart",
        detail: "Informações sobre sua experiência com kart",
        fields: [
          {
            id: "experienceTime",
            name: "Tempo de experiência com Kart",
            type: "select",
            mandatory: false,
            options: kartExperienceYearsOptions.map((option) => ({
              value: option.value.toString(),
              description: option.label,
            })),
          },
          {
            id: "raceFrequency",
            name: "Frequência que corro",
            type: "select",
            mandatory: false,
            options: raceFrequencyOptions.map((option) => ({
              value: option.value.toString(),
              description: option.label,
            })),
          },
          {
            id: "championshipParticipation",
            name: "Participação em campeonatos",
            type: "select",
            mandatory: false,
            options: championshipParticipationOptions.map((option) => ({
              value: option.value.toString(),
              description: option.label,
            })),
          },
          {
            id: "competitiveLevel",
            name: "Nível no kart",
            type: "select",
            mandatory: false,
            options: competitiveLevelOptions.map((option) => ({
              value: option.value.toString(),
              description: option.label,
            })),
          },
        ],
      },
      {
        section: "Estrutura e Interesse",
        detail: "Informações sobre equipamentos e preferências",
        fields: [
          {
            id: "hasOwnKart",
            name: "Possui Kart próprio?",
            type: "select",
            mandatory: false,
            options: [
              { value: "true", description: "Sim" },
              { value: "false", description: "Não" },
            ],
          },
          {
            id: "isTeamMember",
            name: "Participa de alguma equipe?",
            type: "select",
            mandatory: false,
            options: [
              { value: "true", description: "Sim" },
              { value: "false", description: "Não" },
            ],
          },
          {
            id: "teamName",
            name: "Nome da equipe",
            type: "input",
            mandatory: false,
            conditionalField: {
              dependsOn: "isTeamMember",
              showWhen: "true",
            },
            placeholder: "Digite o nome da sua equipe",
          },
          {
            id: "usesTelemetry",
            name: "Faz uso de telemetria?",
            type: "select",
            mandatory: false,
            options: [
              { value: "true", description: "Sim" },
              { value: "false", description: "Não" },
            ],
          },
          {
            id: "telemetryType",
            name: "Telemetria que utiliza",
            type: "input",
            mandatory: false,
            conditionalField: {
              dependsOn: "usesTelemetry",
              showWhen: "true",
            },
            placeholder: "Ex: Race Chrono, AIM, Mycron, etc.",
          },
          {
            id: "preferredTrack",
            name: "Pista favorita",
            type: "input",
            mandatory: false,
            placeholder: "Digite o nome da sua pista favorita",
          },
          {
            id: "attendsEvents",
            name: "Frequenta eventos de kart?",
            type: "select",
            mandatory: false,
            options: attendsEventsOptions.map((option) => ({
              value: option.value.toString(),
              description: option.label,
            })),
          },
          {
            id: "interestCategories",
            name: "Categorias de interesse",
            type: "checkbox-group",
            mandatory: false,
            options: interestCategoryOptions.map((option) => ({
              value: option.value.toString(),
              description: option.label,
            })),
          },
        ],
      },
    ];

    setFormConfig(config);
  }, [cities, user]);

  return (
    <>
      <FormScreen
        title="Editar Perfil"
        description="Mantenha suas informações de piloto sempre atualizadas."
        formConfig={formConfig}
        fetchData={fetchData}
        updateData={updateData}
        transformInitialData={transformInitialData}
        transformSubmitData={transformSubmitData}
        onSuccess={onSuccess}
        onCancel={onCancel}
        onFieldChange={handleFieldChange}
        submitLabel="Salvar alterações"
        id="me"
        formId="edit-profile-form"
        successMessage="Perfil atualizado com sucesso!"
        errorMessage="Ocorreu um erro ao atualizar seu perfil."
      />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="border-t border-border pt-8 mt-8 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-foreground">
                Gerenciamento da Conta
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ações permanentes relacionadas à sua conta de usuário.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              {user?.role === "Member" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Precisa excluir sua conta? Você pode fazer isso aqui. Esta
                    ação é irreversível e todos os seus dados serão
                    permanentemente removidos.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="link"
                      className="text-destructive p-0 h-auto"
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      Quero excluir minha conta permanentemente
                    </Button>
                  </div>
                </>
              ) : user?.role === "Manager" ? (
                <p className="text-sm text-muted-foreground">
                  Entre em contato com o Time BRK para excluir sua conta de
                  organizador.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
};

export default EditProfile;
