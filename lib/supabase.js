import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determinar se estamos rodando em modo mock (caso as credenciais do Supabase não tenham sido configuradas ainda)
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

if (isMockMode) {
  console.warn(
    '⚠️ Supabase credentials missing. Running in MOCK mode (using localStorage/memory). ' +
    'Create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to connect to your real database.'
  );
}

export const supabase = isMockMode ? null : createClient(supabaseUrl, supabaseAnonKey);

// --- SEÇÃO DE MOCK DATA PARA DESENVOLVIMENTO RÁPIDO ---
// Permite que o MVP seja testado localmente sem precisar configurar o banco imediatamente

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
export const mockDb = {
  getBarbeariaBySlug: async (slug) => {
    if (slug === DEFAULT_BARBEARIA.slug) {
      return DEFAULT_BARBEARIA;
    }
    return null;
  },

  getProfissionais: async (barbeariaId) => {
    return DEFAULT_PROFISSIONAIS;
  },

  getServicos: async (barbeariaId) => {
    return getStoredData('barber_servicos', DEFAULT_SERVICOS);
  },

  saveServico: async (servico) => {
    const servicos = getStoredData('barber_servicos', DEFAULT_SERVICOS);
    if (servico.id) {
      const idx = servicos.findIndex(s => s.id === servico.id);
      if (idx !== -1) {
        servicos[idx] = { ...servicos[idx], ...servico };
      }
    } else {
      servico.id = 's-' + Math.random().toString(36).substr(2, 9);
      servico.barbearia_id = 'b1-barbearia-mock-id';
      servicos.push(servico);
    }
    setStoredData('barber_servicos', servicos);
    return servico;
  },

  deleteServico: async (id) => {
    const servicos = getStoredData('barber_servicos', DEFAULT_SERVICOS);
    const filtered = servicos.filter(s => s.id !== id);
    setStoredData('barber_servicos', filtered);
    return true;
  },

  getAgendamentos: async (profissionalId) => {
    console.log('📥 mockDb.getAgendamentos chamado com profissionalId:', profissionalId);
    const agendamentos = getStoredData('barber_agendamentos', []);
    console.log('📥 mockDb retornando', agendamentos.length, 'agendamentos:', agendamentos);
    return agendamentos;
  },

  saveAgendamento: async (agendamento) => {
    const agendamentos = getStoredData('barber_agendamentos', []);
    agendamento.id = 'a-' + Math.random().toString(36).substr(2, 9);
    agendamento.created_at = new Date().toISOString();
    agendamento.status = 'confirmado';
    agendamentos.push(agendamento);
    setStoredData('barber_agendamentos', agendamentos);
    return agendamento;
  },

  cancelAgendamento: async (id) => {
    const agendamentos = getStoredData('barber_agendamentos', []);
    const idx = agendamentos.findIndex(a => a.id === id);
    if (idx !== -1) {
      agendamentos[idx].status = 'cancelado';
      setStoredData('barber_agendamentos', agendamentos);
    }
    return true;
  },

  getBloqueios: async (profissionalId) => {
    return getStoredData('barber_bloqueios', DEFAULT_BLOQUEIOS);
  },

  saveBloqueio: async (bloqueio) => {
    const bloqueios = getStoredData('barber_bloqueios', DEFAULT_BLOQUEIOS);
    bloqueio.id = 'bl-' + Math.random().toString(36).substr(2, 9);
    bloqueios.push(bloqueio);
    setStoredData('barber_bloqueios', bloqueios);
    return bloqueio;
  },

  deleteBloqueio: async (id) => {
    const bloqueios = getStoredData('barber_bloqueios', DEFAULT_BLOQUEIOS);
    const filtered = bloqueios.filter(b => b.id !== id);
    setStoredData('barber_bloqueios', filtered);
    return true;
  }
};
