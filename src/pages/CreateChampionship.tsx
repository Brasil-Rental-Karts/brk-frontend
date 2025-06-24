import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FormScreen } from "@/components/ui/FormScreen";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
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
import { ChampionshipData, ChampionshipService } from "@/lib/services/championship.service";
import { useChampionshipContext } from "@/contexts/ChampionshipContext";

const convertDateToISO = (dateString: string): string | undefined => {
  if (!dateString || dateString.length < 10) return undefined;
  
  const [day, month, year] = dateString.split('/');
  if (!day || !month || !year) return undefined;
  
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return undefined;
  
  return isoDate;
};

export const CreateChampionship = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const { addChampionship } = useChampionshipContext();

  const loadCities = useCallback(async (uf: string) => {
    const citiesData = await fetchCitiesByState(uf);
    setCities(citiesData);
  }, []);

  const handleFieldChange = useCallback(async (fieldId: string, value: any, formData: any, formRef: any) => {
    if (fieldId === "cep" && value && isValidCEPFormat(value)) {
      const addressData = await fetchAddressByCEP(value);
      if (addressData && formRef) {
        formRef.setValue("state", addressData.uf);
        formRef.setValue("fullAddress", addressData.logradouro);
        formRef.setValue("province", addressData.bairro);
        formRef.clearErrors(["state", "city", "fullAddress", "province"]);
        await loadCities(addressData.uf);
        setTimeout(() => {
          formRef.setValue("city", addressData.localidade);
        }, 500);
      }
    }

    if (fieldId === "state" && value) {
      await loadCities(value);
      if (formRef) {
        formRef.setValue("city", "");
      }
    }
    
    if (fieldId === "document" && value && formRef) {
      const personType = formData.personType;
      if (personType === "1" && isValidCNPJFormat(value)) {
        const companyData = await fetchCompanyByCNPJ(value);
        if (companyData && formRef) {
          formRef.setValue("socialReason", companyData.company.name);
          formRef.setValue("cep", masks.cep(companyData.address.zip));
          formRef.setValue("state", companyData.address.state);
          
          formRef.setValue("fullAddress", formatFullAddress(companyData.address));
          formRef.setValue("number", companyData.address.number);
          formRef.setValue("province", companyData.address.district);
          
          formRef.setValue("companyType", "");
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
          
          formRef.clearErrors([
            "socialReason", "cep", "state", "city", "fullAddress", "number",
            "province", "responsiblePhone", "responsibleEmail"
          ]);
          
          await loadCities(companyData.address.state);
          setTimeout(() => {
            formRef.setValue("city", companyData.address.city);
          }, 500);
        }
      }
    }
  }, [loadCities]);

  const transformSubmitData = useCallback((data: any): ChampionshipData => {
    return {
      name: data.name,
      championshipImage: data.championshipImage || '',
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      rules: data.rules || '',
      personType: parseInt(data.personType || '0'),
      document: data.document,
      socialReason: data.socialReason || '',
      cep: data.cep,
      state: data.state,
      city: data.city,
      fullAddress: data.fullAddress,
      number: data.number,
      complement: data.complement || '',
      province: data.province || '',
      isResponsible: data.isResponsible !== false,
      responsibleName: data.responsibleName || '',
      responsiblePhone: data.responsiblePhone || '',
      responsibleEmail: data.responsibleEmail || '',
      responsibleBirthDate: data.responsibleBirthDate ? convertDateToISO(data.responsibleBirthDate) : undefined,
      companyType: data.companyType || undefined,
      incomeValue: data.incomeValue ? parseFloat(data.incomeValue.replace(/[^\d]/g, '')) / 100 : undefined
    };
  }, []);

  const onSuccess = useCallback((championship: any) => {
    addChampionship(championship);
    navigate(`/championship/${championship.id}`, { replace: true });
  }, [addChampionship, navigate]);

  const onCancel = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const createData = useCallback((data: ChampionshipData) => ChampionshipService.create(data), []);

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
            mandatory: true,
            placeholder: "Faça upload da imagem ou insira uma URL",
            accept: "image/*",
            maxSize: 5,
            showPreview: true
          },
          {
            id: "shortDescription",
            name: "Descrição curta do campeonato",
            type: "textarea",
            mandatory: true,
            max_char: 50,
            placeholder: "Breve descrição que aparecerá nas listagens e buscas"
          },
          {
            id: "fullDescription",
            name: "Descrição completa do campeonato",
            type: "textarea",
            mandatory: true,
            max_char: 290,
            placeholder: "Descrição detalhada com informações gerais, categorias, premiação, etc."
          },
          {
            id: "rules",
            name: "Link para o regulamento",
            type: "input",
            mandatory: true,
            placeholder: "https://seusite.com/regulamento.pdf"
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
              { value: "LIMITED", description: "LTDA - Sociedade Limitada" },
              { value: "INDIVIDUAL", description: "Empresário Individual" },
              { value: "ASSOCIATION", description: "Associação" }
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
            mandatory: true,
            placeholder: "Apto, sala, bloco",
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
      }
    ];
    setFormConfig(config);
  }, [cities]);

  return (
    <FormScreen
      title="Criar Campeonato"
      formId="championship-form"
      formConfig={formConfig}
      createData={createData}
      transformSubmitData={transformSubmitData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onFieldChange={handleFieldChange}
      initialValues={{
        personType: "0",
        isResponsible: true,
      }}
      successMessage="Campeonato criado com sucesso!"
      errorMessage="Erro ao criar campeonato."
    />
  );
};

export default CreateChampionship; 