import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { FormScreen } from "@/components/ui/FormScreen";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import {
  Championship,
  ChampionshipData,
  ChampionshipService,
} from "@/lib/services/championship.service";
import {
  extractMainEmail,
  extractMainPhone,
  fetchCompanyByCNPJ,
  formatFullAddress,
  isValidCNPJFormat,
} from "@/utils/cnpj";
import {
  City,
  fetchAddressByCEP,
  fetchCitiesByState,
  isValidCEPFormat,
  states,
} from "@/utils/ibge";
import { masks } from "@/utils/masks";
import { validateDocument } from "@/utils/validation";

// Função auxiliar para converter data DD/MM/AAAA para formato ISO
const convertDateToISO = (dateString: string): string | undefined => {
  if (!dateString || dateString.length < 10) return undefined;

  const [day, month, year] = dateString.split("/");
  if (!day || !month || !year) return undefined;

  const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return undefined;

  return isoDate;
};

// Função auxiliar para converter data ISO para DD/MM/AAAA
const convertISOToDate = (isoString: string): string => {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  return `${day}/${month}/${year}`;
};

export const CreateChampionship = () => {
  const navigate = useNavigate();
  const { championshipId } = useParams<{ championshipId?: string }>();
  const { updateChampionship, getChampionshipInfo } = useChampionshipData();
  const isEditMode = championshipId !== "new" && championshipId !== undefined;

  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);

  // Obter dados do campeonato do contexto
  const championship = getChampionshipInfo();

  const loadCities = useCallback(async (uf: string) => {
    const citiesData = await fetchCitiesByState(uf);
    setCities(citiesData);
  }, []);

  const transformInitialData = useCallback(
    (data: Championship) => ({
      name: data.name || "",
      championshipImage: data.championshipImage || "",
      shortDescription: data.shortDescription || "",
      fullDescription: data.fullDescription || "",
      personType: data.personType?.toString() || "0",
      document: data.document || "",
      socialReason: data.socialReason || "",
      cep: data.cep || "",
      state: data.state || "",
      city: data.city || "",
      fullAddress: data.fullAddress || "",
      number: data.number || "",
      complement: data.complement || "",
      province: data.province || "",
      isResponsible: data.isResponsible !== false,
      responsibleName: data.responsibleName || "",
      responsiblePhone: data.responsiblePhone || "",
      responsibleEmail: data.responsibleEmail || "",
      responsibleBirthDate: data.responsibleBirthDate
        ? convertISOToDate(data.responsibleBirthDate)
        : "",
      companyType: data.companyType || "",
      commissionAbsorbedByChampionship:
        data.commissionAbsorbedByChampionship?.toString() || "true",
    }),
    [],
  );

  const handleFieldChange = useCallback(
    async (
      fieldId: string,
      value: any,
      formData: any,
      formActions: { setValue: (name: string, value: any) => void },
    ) => {
      if (fieldId === "cep" && value && isValidCEPFormat(value)) {
        const addressData = await fetchAddressByCEP(value);
        if (addressData && formActions.setValue) {
          formActions.setValue("state", addressData.uf);
          formActions.setValue("fullAddress", addressData.logradouro);
          formActions.setValue("province", addressData.bairro);
          await loadCities(addressData.uf);
          setTimeout(() => {
            formActions.setValue("city", addressData.localidade);
          }, 100);
        }
      }

      if (fieldId === "state" && value) {
        await loadCities(value);
        if (formActions.setValue) {
          formActions.setValue("city", "");
        }
      }

      if (fieldId === "document" && value && formActions.setValue) {
        const personType = formData.personType;
        if (personType === "1" && isValidCNPJFormat(value)) {
          const companyData = await fetchCompanyByCNPJ(value);
          if (companyData && formActions.setValue) {
            formActions.setValue("socialReason", companyData.company.name);
            formActions.setValue("cep", masks.cep(companyData.address.zip));
            formActions.setValue("state", companyData.address.state);

            formActions.setValue(
              "fullAddress",
              formatFullAddress(companyData.address),
            );
            formActions.setValue("number", companyData.address.number);
            formActions.setValue("province", companyData.address.district);

            formActions.setValue("companyType", "");
            if (companyData.company.simei?.optant) {
              formActions.setValue("companyType", "MEI");
            } else {
              const natureText = companyData.company.nature?.text;
              if (natureText === "Empresário (Individual)") {
                formActions.setValue("companyType", "INDIVIDUAL");
              } else if (natureText === "Sociedade Limitada") {
                formActions.setValue("companyType", "LIMITED");
              } else if (natureText === "Associação Privada") {
                formActions.setValue("companyType", "ASSOCIATION");
              }
            }

            const mainPhone = extractMainPhone(companyData.phones);
            if (mainPhone && !formData.isResponsible) {
              formActions.setValue("responsiblePhone", mainPhone);
            }

            const mainEmail = extractMainEmail(companyData.emails);
            if (mainEmail && !formData.isResponsible) {
              formActions.setValue("responsibleEmail", mainEmail);
            }

            await loadCities(companyData.address.state);
            setTimeout(() => {
              formActions.setValue("city", companyData.address.city);
            }, 100);
          }
        }
      }
    },
    [loadCities],
  );

  const transformSubmitData = useCallback((data: any): ChampionshipData => {
    // Validar campos obrigatórios
    const requiredFields = [
      "name",
      "document",
      "cep",
      "state",
      "city",
      "fullAddress",
      "number",
    ];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      console.error(
        "❌ CreateChampionship: Campos obrigatórios faltando:",
        missingFields,
      );

      // Não vamos lançar erro por enquanto, apenas logar
      // throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    // Validar campos condicionais
    if (data.personType === "1" && !data.socialReason) {
      console.warn(
        "⚠️ CreateChampionship: Razão social é obrigatória para pessoa jurídica",
      );
      // throw new Error('Razão social é obrigatória para pessoa jurídica');
    }

    if (!data.isResponsible) {
      if (!data.responsibleName) {
        console.warn(
          "⚠️ CreateChampionship: Nome do responsável é obrigatório quando você não é o responsável",
        );
        // throw new Error('Nome do responsável é obrigatório quando você não é o responsável');
      }
      if (!data.responsiblePhone) {
        console.warn(
          "⚠️ CreateChampionship: Telefone do responsável é obrigatório quando você não é o responsável",
        );
        // throw new Error('Telefone do responsável é obrigatório quando você não é o responsável');
      }
      if (!data.responsibleEmail) {
        console.warn(
          "⚠️ CreateChampionship: E-mail do responsável é obrigatório quando você não é o responsável",
        );
        // throw new Error('E-mail do responsável é obrigatório quando você não é o responsável');
      }
      if (!data.responsibleBirthDate) {
        console.warn(
          "⚠️ CreateChampionship: Data de nascimento do responsável é obrigatória quando você não é o responsável",
        );
        // throw new Error('Data de nascimento do responsável é obrigatória quando você não é o responsável');
      }
    }

    const transformedData = {
      name: data.name,
      championshipImage: data.championshipImage || "",
      shortDescription: data.shortDescription || "",
      fullDescription: data.fullDescription || "",
      personType: parseInt(data.personType || "0"),
      document: data.document,
      socialReason: data.socialReason || "",
      cep: data.cep,
      state: data.state,
      city: data.city,
      fullAddress: data.fullAddress,
      number: data.number,
      complement: data.complement || "",
      province: data.province || "",
      isResponsible: data.isResponsible !== false,
      responsibleName: data.responsibleName || "",
      responsiblePhone: data.responsiblePhone || "",
      responsibleEmail: data.responsibleEmail || "",
      responsibleBirthDate: data.responsibleBirthDate
        ? convertDateToISO(data.responsibleBirthDate)
        : undefined,
      companyType: data.companyType || undefined,
      commissionAbsorbedByChampionship:
        data.commissionAbsorbedByChampionship === "true" ||
        data.commissionAbsorbedByChampionship === true,
    };

    // Remover campos undefined para evitar problemas com o backend
    Object.keys(transformedData).forEach((key) => {
      if (transformedData[key as keyof typeof transformedData] === undefined) {
        delete transformedData[key as keyof typeof transformedData];
      }
    });

    return transformedData;
  }, []);

  const onSuccess = useCallback(
    (championship: any) => {
      if (isEditMode) {
        navigate(`/championship/${championshipId}`);
      } else {
        navigate(`/championship/${championship.id}`, { replace: true });
      }
    },
    [navigate, championshipId, isEditMode],
  );

  const onCancel = useCallback(() => {
    if (isEditMode) {
      navigate(`/championship/${championshipId}`);
    } else {
      navigate("/dashboard");
    }
  }, [navigate, championshipId, isEditMode]);

  const fetchData = useCallback(
    async (id: string) => {
      if (!isEditMode || !championshipId) {
        throw new Error("ID do campeonato não fornecido");
      }

      try {
        // Buscar campeonato do contexto primeiro
        const championshipFromContext = championship;

        if (championshipFromContext) {
          return championshipFromContext;
        } else {
          // Fallback para backend se não encontrar no contexto
          const championshipData =
            await ChampionshipService.getById(championshipId);
          return championshipData;
        }
      } catch (err: any) {
        console.error(
          "❌ CreateChampionship: Erro ao carregar campeonato:",
          err,
        );
        throw new Error("Erro ao carregar campeonato: " + err.message);
      }
    },
    [isEditMode, championshipId, championship],
  );

  const createData = useCallback(
    (data: ChampionshipData) => ChampionshipService.create(data),
    [],
  );

  const updateData = useCallback(
    async (id: string, data: ChampionshipData) => {
      const updatedChampionship = await ChampionshipService.update(id, data);

      // Atualizar o contexto com o campeonato atualizado
      updateChampionship(id, updatedChampionship);

      return updatedChampionship;
    },
    [updateChampionship],
  );

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
            placeholder: "Ex: Copa de Kart São Paulo 2024",
          },
          {
            id: "championshipImage",
            name: "Imagem do campeonato",
            type: "file",
            mandatory: false,
            placeholder: "Faça upload da imagem ou insira uma URL",
            accept: "image/*",
            maxSize: 5,
            showPreview: true,
          },
          {
            id: "shortDescription",
            name: "Descrição curta do campeonato",
            type: "textarea",
            mandatory: true,
            max_char: 50,
            placeholder: "Breve descrição que aparecerá nas listagens e buscas",
          },
          {
            id: "fullDescription",
            name: "Descrição completa do campeonato",
            type: "textarea",
            mandatory: true,
            max_char: 290,
            placeholder:
              "Descrição detalhada com informações gerais, categorias, premiação, etc.",
          },
        ],
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
              { value: "1", description: "Pessoa Jurídica" },
            ],
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
              errorMessage: "Documento inválido",
            },
          },
          {
            id: "socialReason",
            name: "Razão social",
            type: "input",
            mandatory: true,
            placeholder: "Nome oficial da empresa conforme CNPJ",
            conditionalField: {
              dependsOn: "personType",
              showWhen: "1",
            },
          },
          {
            id: "companyType",
            name: "Tipo de empresa",
            type: "select",
            mandatory: true,
            options: [
              {
                value: "MEI",
                description: "MEI - Microempreendedor Individual",
              },
              { value: "LIMITED", description: "LTDA - Sociedade Limitada" },
              { value: "INDIVIDUAL", description: "Empresário Individual" },
              { value: "ASSOCIATION", description: "Associação" },
            ],
            conditionalField: {
              dependsOn: "personType",
              showWhen: "1",
            },
          },
          {
            id: "cep",
            name: "CEP",
            type: "inputMask",
            mandatory: true,
            mask: "cep",
            placeholder: "00000-000",
          },
          {
            id: "state",
            name: "Estado",
            type: "select",
            mandatory: true,
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
            mandatory: true,
            options: cities.map((city) => ({
              value: city.nome,
              description: city.nome,
            })),
            inline: true,
            inlineGroup: "location",
          },
          {
            id: "fullAddress",
            name: "Endereço completo",
            type: "input",
            mandatory: true,
            placeholder: "Rua, avenida ou logradouro completo",
            inline: true,
            inlineGroup: "addressFull",
          },
          {
            id: "province",
            name: "Bairro",
            type: "input",
            mandatory: true,
            placeholder: "Nome do bairro",
            inline: true,
            inlineGroup: "addressFull",
          },
          {
            id: "number",
            name: "Número",
            type: "input",
            mandatory: true,
            placeholder: "Número do endereço",
            inline: true,
            inlineGroup: "address",
          },
          {
            id: "complement",
            name: "Complemento",
            type: "input",
            mandatory: false,
            placeholder: "Apto, sala, bloco",
            inline: true,
            inlineGroup: "address",
          },
          {
            id: "commissionAbsorbedByChampionship",
            name: "Comissão da plataforma",
            type: "select",
            mandatory: true,
            options: [
              {
                value: "true",
                description:
                  "Absorvida pelo campeonato (percentual descontado do valor recebido)",
              },
              {
                value: "false",
                description:
                  "Cobrada do piloto (percentual adicionado ao valor da inscrição)",
              },
            ],
          },
          {
            id: "isResponsible",
            name: "Sou o responsável do campeonato",
            type: "checkbox",
            mandatory: false,
          },
          {
            id: "responsibleName",
            name: "Nome do responsável",
            type: "input",
            mandatory: true,
            placeholder: "Nome completo da pessoa responsável",
            conditionalField: {
              dependsOn: "isResponsible",
              showWhen: false,
            },
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
              showWhen: false,
            },
          },
          {
            id: "responsibleEmail",
            name: "E-mail do responsável",
            type: "input",
            mandatory: true,
            placeholder: "email@exemplo.com",
            conditionalField: {
              dependsOn: "isResponsible",
              showWhen: false,
            },
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
              showWhen: false,
            },
          },
        ],
      },
    ];
    setFormConfig(config);
  }, [cities]);

  return (
    <FormScreen
      title={isEditMode ? "Editar Campeonato" : "Criar Campeonato"}
      description={
        isEditMode
          ? "Atualize as informações do seu campeonato"
          : "Configure as informações do seu campeonato"
      }
      formId="championship-form"
      formConfig={formConfig}
      id={isEditMode ? championshipId : undefined}
      fetchData={isEditMode ? fetchData : undefined}
      createData={createData}
      updateData={updateData}
      transformInitialData={transformInitialData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onFieldChange={handleFieldChange}
      initialValues={
        !isEditMode
          ? {
              personType: "0",
              isResponsible: true,
              commissionAbsorbedByChampionship: "true",
            }
          : undefined
      }
      successMessage={
        isEditMode
          ? "Campeonato atualizado com sucesso!"
          : "Campeonato criado com sucesso!"
      }
      errorMessage={
        isEditMode
          ? "Erro ao atualizar campeonato."
          : "Erro ao criar campeonato."
      }
    />
  );
};

export default CreateChampionship;
