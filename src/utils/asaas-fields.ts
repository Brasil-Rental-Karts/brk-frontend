export interface AsaasRequiredFields {
  name: boolean;
  email: boolean;
  cpfCnpj: boolean;
  birthDate: boolean;
  companyType: boolean;
  phone: boolean;
  mobilePhone: boolean;
  incomeValue: boolean;
  address: boolean;
  addressNumber: boolean;
  province: boolean;
  postalCode: boolean;
  city: boolean;
  state: boolean;
  complement: boolean;
}

/**
 * Determina quais campos são obrigatórios no Asaas baseado no tipo de pessoa
 * @param personType 0 = Pessoa Física, 1 = Pessoa Jurídica
 * @returns Objeto com indicadores de campos obrigatórios
 */
export function getAsaasRequiredFields(personType: number): AsaasRequiredFields {
  const isCompany = personType === 1;
  
  return {
    name: true, // Nome/Razão Social sempre obrigatório
    email: true, // E-mail sempre obrigatório
    cpfCnpj: true, // CPF/CNPJ sempre obrigatório
    birthDate: !isCompany, // Data de nascimento obrigatória apenas para pessoa física
    companyType: isCompany, // Tipo de empresa obrigatório apenas para pessoa jurídica
    phone: true, // Telefone sempre obrigatório
    mobilePhone: true, // Celular sempre obrigatório
    incomeValue: true, // Faturamento/Renda sempre obrigatório
    address: true, // Endereço sempre obrigatório
    addressNumber: true, // Número sempre obrigatório
    province: true, // Bairro sempre obrigatório
    postalCode: true, // CEP sempre obrigatório
    city: true, // Cidade sempre obrigatória
    state: true, // Estado sempre obrigatório
    complement: false, // Complemento sempre opcional
  };
}

/**
 * Formata o nome do campo com asterisco se for obrigatório
 * @param fieldName Nome do campo
 * @param isRequired Se o campo é obrigatório
 * @returns Nome formatado com asterisco se obrigatório
 */
export function formatFieldName(fieldName: string, isRequired: boolean): string {
  return isRequired ? `${fieldName} *` : fieldName;
} 