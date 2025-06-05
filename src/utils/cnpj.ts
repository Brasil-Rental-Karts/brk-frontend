export interface CNPJData {
  updated: string;
  taxId: string;
  alias: string | null;
  founded: string;
  head: boolean;
  company: {
    members: any[];
    id: number;
    name: string;
    equity: number;
    nature: {
      id: number;
      text: string;
    };
    size: {
      id: number;
      acronym: string;
      text: string;
    };
    simples: {
      optant: boolean;
      since: string | null;
    };
    simei: {
      optant: boolean;
      since: string | null;
    };
  };
  statusDate: string;
  status: {
    id: number;
    text: string;
  };
  reason: {
    id: number;
    text: string;
  };
  address: {
    municipality: number;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    details: string;
    zip: string;
    country: {
      id: number;
      name: string;
    };
  };
  mainActivity: {
    id: number;
    text: string;
  };
  phones: Array<{
    type: string;
    area: string;
    number: string;
  }>;
  emails: Array<{
    ownership: string;
    address: string;
    domain: string;
  }>;
  sideActivities: any[];
  registrations: any[];
  suframa: any[];
}

// Função para buscar dados da empresa por CNPJ
export const fetchCompanyByCNPJ = async (cnpj: string): Promise<CNPJData | null> => {
  try {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Verifica se o CNPJ tem 14 dígitos
    if (cleanCNPJ.length !== 14) {
      return null;
    }
    
    // Busca na API do CNPJA
    const response = await fetch(`https://open.cnpja.com/office/${cleanCNPJ}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data: CNPJData = await response.json();
    
    return data;
  } catch (error) {
    console.error("Erro ao buscar CNPJ:", error);
    return null;
  }
};

// Função para validar formato de CNPJ
export const isValidCNPJFormat = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.length === 14;
};

// Função para extrair o telefone principal
export const extractMainPhone = (phones: CNPJData['phones']): string => {
  if (!phones || phones.length === 0) return '';
  
  // Prioriza telefone mobile, senão pega o primeiro disponível
  const mobilePhone = phones.find(phone => phone.type === 'MOBILE');
  const phone = mobilePhone || phones[0];
  
  if (phone && phone.area && phone.number) {
    return `(${phone.area}) ${phone.number}`;
  }
  
  return '';
};

// Função para extrair o email principal
export const extractMainEmail = (emails: CNPJData['emails']): string => {
  if (!emails || emails.length === 0) return '';
  
  // Prioriza email corporativo, senão pega o primeiro disponível
  const corporateEmail = emails.find(email => email.ownership === 'CORPORATE');
  const email = corporateEmail || emails[0];
  
  return email ? email.address : '';
};

// Função para formatar endereço completo
export const formatFullAddress = (address: CNPJData['address']): string => {
  const parts = [address.street];
  
  if (address.details) {
    parts.push(address.details);
  }
  
  if (address.district) {
    parts.push(address.district);
  }
  
  return parts.join(', ');
}; 