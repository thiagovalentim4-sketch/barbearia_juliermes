import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const createMockQuery = () => {
  const query = {
    select: () => query,
    eq: () => query,
    limit: () => query,
    gte: () => query,
    lte: () => query,
    single: async () => ({ data: null, error: null }),
    insert: () => query,
    update: () => query,
    delete: () => ({ data: null, error: null }),
  };
  return query;
};

const createMockSupabase = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ error: { message: 'Supabase não configurado.' } }),
  },
  from: () => createMockQuery(),
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabase();

const DEFAULT_BARBEARIA = {
  id: 'b1-barbearia-mock-id',
  nome: 'Garagem Barber',
  slug: 'garagem-barber',
  telefone: '(21) 97580-9004',
  endereco: 'Estrada Feliciano Sodré, 3049 - Mesquita (Juscelino)'
};

const DEFAULT_PROFISSIONAIS = [
  {
    id: 'p1-julermes-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Julermes Barber',
    email: 'julermes@garagembarber.com',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  }
];

const DEFAULT_SERVICOS = [
  {
    id: 's1-combo-promo-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'PROMOÇÃO: Corte + Barba Terapia (Ganhe Sobrancelha)',
    preco: 60.00,
    duracao_minutos: 75,
    descricao: 'Pacote promocional completo: Corte de cabelo, tratamento de Barba Terapia e serviço de Sobrancelha incluso grátis!'
  },
  {
    id: 's2-corte-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Corte',
    preco: 30.00,
    duracao_minutos: 30,
    descricao: 'Corte de cabelo completo com acabamento impecável.'
  },
  {
    id: 's3-barba-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Barba',
    preco: 20.00,
    duracao_minutos: 30,
    descricao: 'Aparado e desenhado de barba com navalha e toalha quente.'
  },
  {
    id: 's4-acabamento-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Acabamento (Pé)',
    preco: 5.00,
    duracao_minutos: 15,
    descricao: 'Apenas a limpeza das laterais e nuca.'
  },
  {
    id: 's5-pigmentacao-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Pigmentação',
    preco: 15.00,
    duracao_minutos: 30,
    descricao: 'Disfarce de falhas no cabelo ou barba com pigmentação.'
  },
  {
    id: 's6-platinado-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Platinado (A partir)',
    preco: 60.00,
    duracao_minutos: 120,
    descricao: 'Descoloração global e tonalização cinza platinada.'
  },
  {
    id: 's7-reflexo-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Reflexo (A partir)',
    preco: 45.00,
    duracao_minutos: 90,
    descricao: 'Luzes/mechas marcadas ou alinhadas na touca ou papel.'
  },
  {
    id: 's8-barbaterapia-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Barba Terapia',
    preco: 30.00,
    duracao_minutos: 45,
    descricao: 'Massagem facial, óleos essenciais, toalha quente e barbear completo relaxante.'
  },
  {
    id: 's9-sobrancelha-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Sobrancelha',
    preco: 5.00,
    duracao_minutos: 15,
    descricao: 'Design e limpeza da sobrancelha na navalha.'
  },
  {
    id: 's10-limpeza-pele-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Limpeza de Pele',
    preco: 15.00,
    duracao_minutos: 30,
    descricao: 'Remoção de cravos e impurezas com máscara preta e hidratação.'
  },
  {
    id: 's11-corte-infantil-id',
    barbearia_id: 'b1-barbearia-mock-id',
    nome: 'Corte Infantil',
    preco: 30.00,
    duracao_minutos: 30,
    descricao: 'Corte de cabelo especial para crianças.'
  }
];

const DEFAULT_BLOQUEIOS = [
  // Bloqueios de teste padrão
];

// Helper para obter dados do localStorage
const getStoredData = (key, defaultValue) => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(stored);
};

const setStoredData = (key, data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Funções de leitura e escrita mockadas (comportam-se como chamadas assíncronas do Supabase)
