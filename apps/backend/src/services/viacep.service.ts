const VIA_CEP_BASE_URL = 'https://viacep.com.br/ws';

export interface ViaCepAddress {
  postalCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
}

const sanitizePostalCode = (postalCode: string) => postalCode.replace(/\D/g, '').padStart(8, '0');

export const viaCepService = {
  async lookup(postalCode: string): Promise<ViaCepAddress> {
    const sanitized = sanitizePostalCode(postalCode);

    if (sanitized.length !== 8) {
      throw new Error('Invalid postal code length');
    }

    const response = await fetch(`${VIA_CEP_BASE_URL}/${sanitized}/json/`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch postal code information');
    }

    const data = (await response.json()) as {
      erro?: boolean;
      logradouro?: string | null;
      bairro?: string | null;
      localidade?: string | null;
      uf?: string | null;
      complemento?: string | null;
    };

    if (data.erro) {
      throw new Error('Postal code not found');
    }

    return {
      postalCode: sanitized,
      street: data.logradouro ?? '',
      district: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
      complement: data.complemento ?? null
    };
  }
};
