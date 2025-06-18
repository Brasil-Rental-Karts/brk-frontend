import { useState, useEffect, useCallback } from "react";
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
import { ChampionshipService, Championship, ChampionshipData, AsaasStatus } from "@/lib/services/championship.service";
import { AlertTriangle } from "lucide-react";
import { useFormScreen } from "@/hooks/use-form-screen";

interface EditChampionshipTabProps {
  championshipId: string;
}

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

// Função auxiliar para converter data ISO para DD/MM/AAAA
const convertISOToDate = (isoString: string): string => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${day}/${month}/${year}`;
};

export const EditChampionshipTab = ({ championshipId }: EditChampionshipTabProps) => {
  const [asaasStatus, setAsaasStatus] = useState<AsaasStatus | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);

  const loadCities = useCallback(async (uf: string) => {
    const citiesData = await fetchCitiesByState(uf);
    setCities(citiesData);
  }, []);

  const fetchData = useCallback(async (id: string) => {
    const [championshipData, statusData] = await Promise.all([
      ChampionshipService.getById(id),
      ChampionshipService.getAsaasStatus(id),
    ]);
    setAsaasStatus(statusData);
    if (championshipData.state) {
      await loadCities(championshipData.state);
    }
    return championshipData;
  }, [loadCities]);

  const updateData = useCallback((id: string, data: Partial<ChampionshipData>) => 
    ChampionshipService.update(id, data), 
  []);

  const transformInitialData = useCallback((championship: Championship) => ({
    name: championship.name || "",
    championshipImage: championship.championshipImage || "",
    shortDescription: championship.shortDescription || "",
    fullDescription: championship.fullDescription || "",
    rules: championship.rules || "",
    personType: championship.personType?.toString() || "0",
    document: championship.document || "",
    socialReason: championship.socialReason || "",
    cep: championship.cep || "",
    state: championship.state || "",
    city: championship.city || "",
    fullAddress: championship.fullAddress || "",
    number: championship.number || "",
    complement: championship.complement || "",
    province: championship.province || "",
    isResponsible: championship.isResponsible !== false,
    responsibleName: championship.responsibleName || "",
    responsiblePhone: championship.responsiblePhone || "",
    responsibleEmail: championship.responsibleEmail || "",
    responsibleBirthDate: championship.responsibleBirthDate
      ? convertISOToDate(championship.responsibleBirthDate)
      : "",
    companyType: championship.companyType || "",
    incomeValue: championship.incomeValue?.toString() || ""
  }), []);

  const transformSubmitData = useCallback((data: any) => {
    const championshipData: Partial<ChampionshipData> = {
      name: data.name,
      championshipImage: data.championshipImage || "",
      shortDescription: data.shortDescription || "",
      fullDescription: data.fullDescription || "",
      rules: data.rules || "",
      sponsors: data.sponsors || [],
    };

    if (!asaasStatus?.configured) {
      championshipData.personType = parseInt(data.personType || "0");
      championshipData.document = data.document;
      championshipData.socialReason = data.socialReason || "";
      championshipData.cep = data.cep;
      championshipData.state = data.state;
      championshipData.city = data.city;
      championshipData.fullAddress = data.fullAddress;
      championshipData.number = data.number;
      championshipData.complement = data.complement || "";
      championshipData.province = data.province || "";
      championshipData.isResponsible = data.isResponsible !== false;
      championshipData.responsibleName = data.responsibleName || "";
      championshipData.responsiblePhone = data.responsiblePhone || "";
      championshipData.responsibleEmail = data.responsibleEmail || "";
      championshipData.responsibleBirthDate = data.responsibleBirthDate
        ? convertDateToISO(data.responsibleBirthDate)
        : undefined;
      championshipData.companyType = data.companyType || undefined;
      championshipData.incomeValue = data.incomeValue ? parseFloat(data.incomeValue.replace(/[^\d]/g, '')) / 100 : undefined
    }
    return championshipData;
  }, [asaasStatus]);

  const onSuccess = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const {
    isLoading,
    isSaving,
    error,
    initialData,
    formRef,
    onFormReady,
    handleSubmit,
    handleFormChange,
  } = useFormScreen<Championship, Partial<ChampionshipData>>({
    id: championshipId,
    fetchData,
    updateData,
    transformInitialData,
    transformSubmitData,
    onSuccess,
    onCancel: () => {},
    successMessage: "Dados do campeonato atualizados com sucesso!",
  });

  const handleFieldChange = useCallback(async (fieldId: string, value: any, formData: any) => {
    if (fieldId === "cep" && value && isValidCEPFormat(value) && formRef && !asaasStatus?.configured) {
      try {
        const addressData = await fetchAddressByCEP(value);
        if (addressData) {
          formRef.setValue("state", addressData.uf);
          formRef.setValue("fullAddress", addressData.logradouro);
          formRef.setValue("province", addressData.bairro);
          await loadCities(addressData.uf);
          setTimeout(() => {
            formRef.setValue("city", addressData.localidade);
          }, 500);
        }
      } catch (error) {
        console.warn("Erro ao buscar endereço por CEP:", error);
      }
    }
    
    if (fieldId === "state" && value && formRef) {
      await loadCities(value);
      formRef.setValue("city", "");
    }

    if (fieldId === "document" && value && formRef && !asaasStatus?.configured) {
      const personType = formData.personType;
      if (personType === "1" && isValidCNPJFormat(value)) {
        try {
          const companyData = await fetchCompanyByCNPJ(value);
          if (companyData) {
            formRef.setValue("socialReason", companyData.company.name);
            formRef.setValue("cep", masks.cep(companyData.address.zip));
            formRef.setValue("state", companyData.address.state);
            formRef.setValue("fullAddress", formatFullAddress(companyData.address));
            formRef.setValue("number", companyData.address.number);
            formRef.setValue("province", companyData.address.district);
            
            formRef.setValue("companyType", ""); // Clear previous value
            if (companyData.company.simei?.optant) {
              formRef.setValue("companyType", "MEI");
            } else {
              const natureText = companyData.company.nature?.text;
              if (natureText === "Empresário (Individual)") {
                formRef.setValue("companyType", "INDIVIDUAL");
              } else if (natureText === "Sociedade Limitada") {
                formRef.setValue("companyType", "LIMITED");
              } else if (natureText === "Associação Privada") {
                formRef.setValue("companyType", "ASSOCIATION");
              }
            }

            const mainPhone = extractMainPhone(companyData.phones);
            if (mainPhone && !formData.isResponsible) {
              formRef.setValue("responsiblePhone", mainPhone);
            }
            
            const mainEmail = extractMainEmail(companyData.emails);
            if (mainEmail && !formData.isResponsible) {
              formRef.setValue("responsibleEmail", mainEmail);
            }
            await loadCities(companyData.address.state);
            setTimeout(() => {
              formRef.setValue("city", companyData.address.city);
            }, 500);
          }
        } catch (error) {
          console.warn("Erro ao buscar dados da empresa:", error);
        }
      }
    }
  }, [asaasStatus, loadCities, formRef]);

  useEffect(() => {
    if (!asaasStatus) return;

    const config: FormSectionConfig[] = [
      {
        section: "Sobre o Campeonato",
        detail: "Informações visíveis aos usuários",
        fields: [
          {
            id: "name",
            name: "Nome do campeonato",
            type: "input" as const,
            mandatory: true,
            max_char: 90,
            placeholder: "Ex: Copa de Kart São Paulo 2024",
          },
          {
            id: "championshipImage",
            name: "Imagem do campeonato",
            type: "file" as const,
            mandatory: true,
            placeholder: "Faça upload da imagem ou insira uma URL",
            accept: "image/*",
            maxSize: 5,
            showPreview: true,
          },
          {
            id: "shortDescription",
            name: "Descrição curta do campeonato",
            type: "textarea" as const,
            mandatory: true,
            max_char: 165,
            placeholder: "Breve descrição que aparecerá nas listagens e buscas",
          },
          {
            id: "fullDescription",
            name: "Descrição completa do campeonato",
            type: "textarea" as const,
            mandatory: true,
            max_char: 1000,
            placeholder:
              "Descrição detalhada com informações gerais, categorias, premiação, etc.",
          },
          {
            id: "rules",
            name: "Link para o regulamento",
            type: "input" as const,
            mandatory: true,
            placeholder: "https://seusite.com/regulamento.pdf",
          },
        ],
      },
      ...(asaasStatus.configured
        ? []
        : [
            {
              section: "Dados Gerais",
              detail: "Informações legais do campeonato",
              fields: [
                {
                  id: "personType",
                  name: "Tipo de pessoa",
                  type: "select" as const,
                  mandatory: true,
                  options: [
                    { value: "0", description: "Pessoa Física" },
                    { value: "1", description: "Pessoa Jurídica" },
                  ],
                },
                {
                  id: "document",
                  name: "Documento",
                  type: "inputMask" as const,
                  mandatory: true,
                  mask: "cpf" as const,
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
                  type: "input" as const,
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
                  type: "select" as const,
                  mandatory: true,
                  options: [
                    {
                      value: "MEI",
                      description: "MEI - Microempreendedor Individual",
                    },
                    {
                      value: "LIMITED",
                      description: "Limited - Sociedade Limitada",
                    },
                    {
                      value: "INDIVIDUAL",
                      description: "Individual - Empresário Individual",
                    },
                    {
                      value: "ASSOCIATION",
                      description: "Association - Associação",
                    },
                  ],
                  conditionalField: {
                    dependsOn: "personType",
                    showWhen: "1",
                  },
                },
                {
                  id: "cep",
                  name: "CEP",
                  type: "inputMask" as const,
                  mandatory: true,
                  mask: "cep" as const,
                  placeholder: "00000-000",
                },
                {
                  id: "state",
                  name: "Estado",
                  type: "select" as const,
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
                  type: "select" as const,
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
                  type: "input" as const,
                  mandatory: true,
                  placeholder: "Rua, avenida ou logradouro completo",
                  inline: true,
                  inlineGroup: "addressFull",
                },
                {
                  id: "province",
                  name: "Bairro",
                  type: "input" as const,
                  mandatory: true,
                  placeholder: "Nome do bairro",
                  inline: true,
                  inlineGroup: "addressFull",
                },
                {
                  id: "number",
                  name: "Número",
                  type: "input" as const,
                  mandatory: true,
                  placeholder: "Número do endereço",
                  inline: true,
                  inlineGroup: "address",
                },
                {
                  id: "complement",
                  name: "Complemento",
                  type: "input" as const,
                  mandatory: true,
                  placeholder: "Apto, sala, bloco",
                  inline: true,
                  inlineGroup: "address",
                },
                {
                  id: "incomeValue",
                  name: "Faturamento/Renda mensal",
                  type: "inputMask" as const,
                  mandatory: true,
                  mask: "currency" as const,
                  placeholder: "R$ 0,00",
                },
                {
                  id: "isResponsible",
                  name: "Sou o responsável do campeonato",
                  type: "checkbox" as const,
                  mandatory: false,
                },
                {
                  id: "responsibleName",
                  name: "Nome do responsável",
                  type: "input" as const,
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
                  type: "inputMask" as const,
                  mandatory: true,
                  mask: "phone" as const,
                  placeholder: "(11) 99999-9999",
                  conditionalField: {
                    dependsOn: "isResponsible",
                    showWhen: false,
                  },
                },
                {
                  id: "responsibleEmail",
                  name: "E-mail do responsável",
                  type: "input" as const,
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
                  type: "inputMask" as const,
                  mandatory: true,
                  mask: "date" as const,
                  placeholder: "DD/MM/AAAA",
                  conditionalField: {
                    dependsOn: "isResponsible",
                    showWhen: false,
                  },
                },
              ],
            },
          ]),
    ];
    setFormConfig(config);
  }, [asaasStatus, cities]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          Carregando dados do campeonato...
        </div>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Campeonato não encontrado</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados do campeonato.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Editar Dados do Campeonato</h2>
          <p className="text-muted-foreground">
            Atualize as informações do seu campeonato
          </p>
        </div>
        <div>
          <Button
            onClick={() => {
              const form = document.getElementById("edit-championship-form") as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {asaasStatus?.configured && (
        <Alert variant="warning">
          <AlertTitle>Conta Asaas Configurada</AlertTitle>
          <AlertDescription>
            Como já existe uma conta Asaas configurada para este campeonato, os
            campos referente aos dados legais e financeiros não podem mais ser
            alterados. Apenas as informações sobre o campeonato podem ser
            editadas.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao salvar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {formConfig.length > 0 && (
        <DynamicForm
          config={formConfig}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onFieldChange={handleFieldChange}
          onFormReady={onFormReady}
          submitLabel={isSaving ? "Salvando..." : "Salvar Alterações"}
          showButtons={true}
          className="space-y-6"
          formId="edit-championship-form"
          initialValues={initialData}
        />
      )}
    </div>
  );
}; 