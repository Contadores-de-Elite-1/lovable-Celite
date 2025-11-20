/**
 * Dados das fotos dos serviços
 * 
 * Imagens corretas do espaço físico - SEM logomarcas
 * Ordem específica definida pelo usuário
 * Descrições que geram desejo no cliente final
 */

export interface FotoEspaco {
  id: string;
  src: string;
  alt: string;
  descricao?: string;
}

export const fotosEspaco: FotoEspaco[] = [
  // Ordem específica definida pelo usuário
  {
    id: 'fachada-noite',
    src: '/images/espaco/fachada-noite.jpeg',
    alt: 'Fachada iluminada à noite',
    descricao: 'Profissionalismo 24/7: a imagem perfeita para sua contabilidade',
  },
  {
    id: 'fachada-estacionamento',
    src: '/images/espaco/fachada-estacionamento.jpeg',
    alt: 'Fachada com estacionamento',
    descricao: 'Acessibilidade completa: seus clientes chegam com facilidade e segurança',
  },
  {
    id: 'pagina-3-img-3',
    src: '/images/espaco/pagina-3-img-3.jpg',
    alt: 'Espaço profissional moderno',
    descricao: 'Ambientes de impacto onde grandes negócios e estratégias são consolidados',
  },
  {
    id: 'imagem-p4',
    src: '/images/espaco/imagem-p4.jpg',
    alt: 'Infraestrutura completa',
    descricao: 'Tecnologia e infraestrutura premium para surpreender seus clientes',
  },
  {
    id: 'pagina-2-img-3',
    src: '/images/espaco/pagina-2-img-3.jpg',
    alt: 'Espaço executivo',
    descricao: 'Sofisticação e elegância em cada detalhe, refletindo sua excelência',
  },
  {
    id: 'sala-executiva-3',
    src: '/images/espaco/Sala executiva 3 pessoas.jpg',
    alt: 'Sala executiva para reuniões',
    descricao: 'Ambientes privativas e aconchegantes para reuniões estratégicas com seus clientes',
  },
  {
    id: 'pagina-3-img-2',
    src: '/images/espaco/pagina-3-img-2.jpg',
    alt: 'Ambiente de trabalho',
    descricao: 'Espaços otimizados que amplificam a produtividade e credibilidade',
  },
  {
    id: 'pagina-4-img-2',
    src: '/images/espaco/pagina-4-img-2.jpg',
    alt: 'Serviços profissionais',
    descricao: 'Atenção aos detalhes que impressionam clientes e reforçam sua reputação',
  },
  {
    id: 'pagina-2-img-4',
    src: '/images/espaco/pagina-2-img-4.jpg',
    alt: 'Espaço profissional',
    descricao: 'O endereço comercial que potencializa a imagem do seu negócio',
  },
  {
    id: 'pagina-2-img-2',
    src: '/images/espaco/pagina-2-img-2.jpg',
    alt: 'Ambiente colaborativo',
    descricao: 'Modernidade e prestígio: a infraestrutura que sua empresa merece',
  },
  {
    id: 'pagina-3-img-1',
    src: '/images/espaco/pagina-3-img-1.jpg',
    alt: 'Espaço profissional completo',
    descricao: 'Confiança e credibilidade transmitidas a cada encontro com seus clientes',
  },
];
