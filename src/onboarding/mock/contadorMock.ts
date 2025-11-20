// Mock temporário para testes - será substituído pela API real
// Cores da logo Contadores de Elite: Azul Marinho (#0C1A2A) e Dourado (#D4AF37)
export const CONTADOR_MOCK = {
  id: 'mock-contador-123',
  nome: 'Contadores de Elite',
  logo_url: '/images/logo-contadores-elite.jpeg',
  cor_primaria: '#0C1A2A',
  cor_secundaria: '#D4AF37',
};

// Simula a API de busca do contador
export const fetchContadorByLink = async (linkContador: string) => {
  // Simular delay de rede
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  // Para testes, qualquer link vai retornar o mock
  if (linkContador) {
    return CONTADOR_MOCK;
  }
  
  throw new Error('Link inválido');
};

