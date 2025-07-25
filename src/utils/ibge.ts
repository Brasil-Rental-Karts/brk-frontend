export interface City {
  id: number;
  nome: string;
}

export interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

// Lista de estados brasileiros
export const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

// Função para buscar cidades por estado
export const fetchCitiesByState = async (uf: string): Promise<City[]> => {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: City[] = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao carregar cidades:", error);
    return [];
  }
};

// Função para buscar endereço por CEP
export const fetchAddressByCEP = async (
  cep: string,
): Promise<AddressData | null> => {
  try {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, "");

    // Verifica se o CEP tem 8 dígitos
    if (cleanCEP.length !== 8) {
      return null;
    }

    // Busca na API do ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

    if (!response.ok) {
      return null;
    }

    const data: AddressData = await response.json();

    // Verifica se houve erro na resposta
    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
};

// Função para validar formato de CEP
export const isValidCEPFormat = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, "");
  return cleanCEP.length === 8;
};

// Função para buscar estado por código IBGE
export const getStateByIBGECode = (ibgeCode: string): string | null => {
  // Mapeamento dos códigos IBGE para UF
  const ibgeToUF: Record<string, string> = {
    "12": "AC",
    "27": "AL",
    "16": "AP",
    "13": "AM",
    "29": "BA",
    "23": "CE",
    "53": "DF",
    "32": "ES",
    "52": "GO",
    "21": "MA",
    "51": "MT",
    "50": "MS",
    "31": "MG",
    "15": "PA",
    "25": "PB",
    "41": "PR",
    "26": "PE",
    "22": "PI",
    "33": "RJ",
    "24": "RN",
    "43": "RS",
    "11": "RO",
    "14": "RR",
    "42": "SC",
    "35": "SP",
    "28": "SE",
    "17": "TO",
  };

  const stateCode = ibgeCode.substring(0, 2);
  return ibgeToUF[stateCode] || null;
};
