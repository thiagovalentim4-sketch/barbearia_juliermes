-- Schema de Banco de Dados para o MVP do SaaS de Barbearia

-- Habilitar a extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE BARBEARIAS (Tenants)
CREATE TABLE public.barbearias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. TABELA DE PROFISSIONAIS (Barbeiros)
CREATE TABLE public.profissionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. TABELA DE SERVIÇOS
CREATE TABLE public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    duracao_minutos INTEGER NOT NULL, -- Duração em minutos (ex: 30, 45, 60)
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. TABELA DE AGENDAMENTOS
CREATE TABLE public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(20) NOT NULL,
    cliente_email VARCHAR(255),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmado' NOT NULL CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. TABELA DE BLOQUEIOS (Férias, almoço, bloqueio manual)
CREATE TABLE public.bloqueios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    data_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- --- ÍNDICES PARA PERFORMANCE ---
CREATE INDEX idx_barbearias_slug ON public.barbearias(slug);
CREATE INDEX idx_profissionais_barbearia ON public.profissionais(barbearia_id);
CREATE INDEX idx_servicos_barbearia ON public.servicos(barbearia_id);
CREATE INDEX idx_agendamentos_profissional ON public.agendamentos(profissional_id);
CREATE INDEX idx_agendamentos_data_hora ON public.agendamentos(data_hora);
CREATE INDEX idx_bloqueios_profissional ON public.bloqueios(profissional_id);

-- --- HABILITAR SEGURANÇA NO BANCO (Row Level Security - RLS) ---
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;

-- --- POLÍTICAS DE RLS (Barbeiro / Cliente) ---

-- 1. Políticas de Barbearias
CREATE POLICY "Público pode visualizar barbearia por slug" ON public.barbearias
    FOR SELECT USING (true);

CREATE POLICY "Dono pode gerenciar sua barbearia" ON public.barbearias
    FOR ALL USING (auth.uid() = owner_id);

-- 2. Políticas de Profissionais
CREATE POLICY "Público pode visualizar profissionais" ON public.profissionais
    FOR SELECT USING (true);

CREATE POLICY "Barbeiro logado pode gerenciar profissionais" ON public.profissionais
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbearias 
            WHERE barbearias.id = profissionais.barbearia_id 
            AND barbearias.owner_id = auth.uid()
        )
    );

-- 3. Políticas de Serviços
CREATE POLICY "Público pode visualizar serviços" ON public.servicos
    FOR SELECT USING (true);

CREATE POLICY "Barbeiro logado pode gerenciar serviços" ON public.servicos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbearias 
            WHERE barbearias.id = servicos.barbearia_id 
            AND barbearias.owner_id = auth.uid()
        )
    );

-- 4. Políticas de Agendamentos
CREATE POLICY "Público pode criar agendamentos" ON public.agendamentos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Público pode ver os horários já agendados (para evitar double-booking)" ON public.agendamentos
    FOR SELECT USING (true);

CREATE POLICY "Barbeiro logado pode gerenciar agendamentos da sua barbearia" ON public.agendamentos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profissionais
            JOIN public.barbearias ON barbearias.id = profissionais.barbearia_id
            WHERE profissionais.id = agendamentos.profissional_id
            AND barbearias.owner_id = auth.uid()
        )
    );

-- 5. Políticas de Bloqueios
CREATE POLICY "Público pode ver os bloqueios (para evitar agendar em horários bloqueados)" ON public.bloqueios
    FOR SELECT USING (true);

CREATE POLICY "Barbeiro logado pode gerenciar bloqueios" ON public.bloqueios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profissionais
            JOIN public.barbearias ON barbearias.id = profissionais.barbearia_id
            WHERE profissionais.id = bloqueios.profissional_id
            AND barbearias.owner_id = auth.uid()
        )
    );

-- --- FUNÇÃO AUXILIAR PARA POPULAR DADOS DE TESTE ---
-- Executar isso caso queira testar rapidamente
CREATE OR REPLACE FUNCTION public.popular_dados_teste(barbearia_slug TEXT, dono_uuid UUID)
RETURNS VOID AS $$
DECLARE
    v_barbearia_id UUID;
    v_profissional_id UUID;
    v_servico_corte UUID;
    v_servico_barba UUID;
BEGIN
    -- Inserir barbearia
    INSERT INTO public.barbearias (owner_id, nome, slug, telefone, endereco)
    VALUES (dono_uuid, 'Barbearia do José', barbearia_slug, '11999998888', 'Rua das Flores, 123 - Centro')
    RETURNING id INTO v_barbearia_id;

    -- Inserir profissional
    INSERT INTO public.profissionais (barbearia_id, nome, email, avatar_url)
    VALUES (v_barbearia_id, 'José da Navalha', 'jose@navalha.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
    RETURNING id INTO v_profissional_id;

    -- Inserir serviços
    INSERT INTO public.servicos (barbearia_id, nome, preco, duracao_minutos, descricao)
    VALUES (v_barbearia_id, 'Corte Cabelo Masculino', 40.00, 30, 'Corte clássico ou moderno, tesoura ou máquina.')
    RETURNING id INTO v_servico_corte;

    INSERT INTO public.servicos (barbearia_id, nome, preco, duracao_minutos, descricao)
    VALUES (v_barbearia_id, 'Barba Completa', 30.00, 30, 'Barba feita com toalha quente e navalha.')
    RETURNING id INTO v_servico_barba;

    -- Inserir bloqueios de teste (ex: almoço das 12:00 às 13:00)
    -- As datas reais podem ser ajustadas dinamicamente na aplicação
END;
$$ LANGUAGE plpgsql;
