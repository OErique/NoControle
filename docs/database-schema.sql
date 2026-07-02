-- =====================================================
-- SAAS FINANCEIRO PESSOAL - SCHEMA DO BANCO DE DADOS
-- Documentação em Português para Diagramas
-- =====================================================

-- =====================================================
-- 1. MÓDULO DE USUÁRIOS E AUTENTICAÇÃO
-- =====================================================

-- Tabela: PLANOS
-- Descrição: Planos de assinatura disponíveis no sistema
CREATE TABLE planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,                    -- Nome do plano (Gratuito, Completo, Total)
    slug VARCHAR(50) UNIQUE NOT NULL,              -- Identificador URL amigável
    descricao TEXT,                                -- Descrição do plano
    preco NUMERIC(10,2) DEFAULT 0,                 -- Preço mensal em reais
    modulos_permitidos INTEGER DEFAULT 3,          -- Quantidade de módulos liberados
    funcionalidades JSONB,                         -- Lista de funcionalidades em JSON
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: NIVEIS_USUARIO
-- Descrição: Níveis de gamificação do usuário
CREATE TABLE niveis_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,                    -- Nome do nível (Iniciante, Bronze, Prata, etc)
    slug VARCHAR(50) UNIQUE NOT NULL,              -- Identificador
    pontos_minimos INTEGER NOT NULL,               -- Pontos mínimos para atingir
    pontos_maximos INTEGER,                        -- Pontos máximos do nível
    icone VARCHAR(50),                             -- Ícone representativo
    cor VARCHAR(20),                               -- Cor principal
    gradiente_inicio VARCHAR(20),                  -- Cor do gradiente (início)
    gradiente_fim VARCHAR(20),                     -- Cor do gradiente (fim)
    beneficios JSONB,                              -- Benefícios do nível em JSON
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: USUARIOS
-- Descrição: Usuários cadastrados no sistema
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,                    -- Nome completo
    email VARCHAR(255) UNIQUE NOT NULL,            -- Email (login)
    senha_hash VARCHAR(255) NOT NULL,              -- Senha criptografada (bcrypt)
    avatar_url TEXT,                               -- URL da foto de perfil
    plano_id UUID REFERENCES planos(id),           -- FK para plano atual
    plano_expira_em TIMESTAMP,                     -- Data de expiração do plano
    pontos_totais INTEGER DEFAULT 0,               -- Pontos acumulados
    sequencia_atual INTEGER DEFAULT 0,             -- Dias consecutivos de uso
    maior_sequencia INTEGER DEFAULT 0,             -- Recorde de dias consecutivos
    nivel_atual_id UUID REFERENCES niveis_usuario(id), -- FK para nível atual
    apostas_habilitadas BOOLEAN DEFAULT FALSE,     -- Módulo de apostas ativo
    renda_mensal NUMERIC(12,2),                    -- Renda mensal declarada
    score_financeiro INTEGER DEFAULT 0,            -- Pontuação financeira (0-1000)
    preferencia_tema VARCHAR(20) DEFAULT 'dark',   -- Tema: light ou dark
    onboarding_completo BOOLEAN DEFAULT FALSE,     -- Completou o tutorial inicial
    email_verificado BOOLEAN DEFAULT FALSE,        -- Email confirmado
    ultima_atividade DATE,                         -- Data da última atividade
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: SESSOES
-- Descrição: Sessões de login ativas
CREATE TABLE sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,              -- Hash do token JWT
    expira_em TIMESTAMP NOT NULL,                  -- Data de expiração
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: PERFIS_USUARIO
-- Descrição: Configurações de perfil público do usuário
CREATE TABLE perfis_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    biografia TEXT,                                -- Texto de apresentação
    perfil_publico BOOLEAN DEFAULT FALSE,          -- Perfil visível para outros
    mostrar_nivel BOOLEAN DEFAULT TRUE,            -- Exibir nível no perfil
    mostrar_sequencias BOOLEAN DEFAULT TRUE,       -- Exibir sequências
    mostrar_conquistas BOOLEAN DEFAULT TRUE,       -- Exibir badges/conquistas
    permitir_comentarios BOOLEAN DEFAULT TRUE,     -- Aceitar comentários
    permitir_pedidos_dicas BOOLEAN DEFAULT TRUE,   -- Aceitar perguntas
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. MÓDULO FINANCEIRO - RECEITAS E DESPESAS
-- =====================================================

-- Tabela: CATEGORIAS_DESPESA
-- Descrição: Categorias para classificar despesas
CREATE TABLE categorias_despesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, -- NULL = categoria padrão
    nome VARCHAR(100) NOT NULL,                    -- Nome da categoria
    icone VARCHAR(50),                             -- Emoji ou classe de ícone
    cor VARCHAR(20),                               -- Cor hexadecimal (#FF5733)
    padrao_sistema BOOLEAN DEFAULT FALSE,          -- É categoria padrão do sistema
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: CATEGORIAS_RECEITA
-- Descrição: Categorias para classificar receitas
CREATE TABLE categorias_receita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, -- NULL = categoria padrão
    nome VARCHAR(100) NOT NULL,                    -- Nome da categoria
    icone VARCHAR(50),                             -- Emoji ou classe de ícone
    cor VARCHAR(20),                               -- Cor hexadecimal
    padrao_sistema BOOLEAN DEFAULT FALSE,          -- É categoria padrão do sistema
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: DESPESAS
-- Descrição: Registro de despesas/gastos do usuário
CREATE TABLE despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias_despesa(id),
    cartao_credito_id UUID REFERENCES cartoes_credito(id), -- Se pago no cartão
    descricao VARCHAR(255) NOT NULL,               -- Descrição da despesa
    valor NUMERIC(12,2) NOT NULL,                  -- Valor em reais
    data DATE NOT NULL,                            -- Data da despesa
    recorrente BOOLEAN DEFAULT FALSE,              -- É despesa recorrente
    tipo_recorrencia VARCHAR(20),                  -- mensal, semanal, anual
    numero_parcela INTEGER,                        -- Parcela atual (1, 2, 3...)
    total_parcelas INTEGER,                        -- Total de parcelas
    grupo_parcelas_id UUID,                        -- Agrupa parcelas da mesma compra
    hash_importacao VARCHAR(255),                  -- Hash para evitar duplicatas
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: RECEITAS
-- Descrição: Registro de receitas/ganhos do usuário
CREATE TABLE receitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias_receita(id),
    descricao VARCHAR(255) NOT NULL,               -- Descrição da receita
    valor NUMERIC(12,2) NOT NULL,                  -- Valor em reais
    data DATE NOT NULL,                            -- Data da receita
    recorrente BOOLEAN DEFAULT FALSE,              -- É receita recorrente
    tipo_recorrencia VARCHAR(20),                  -- mensal, semanal, anual
    hash_importacao VARCHAR(255),                  -- Hash para evitar duplicatas
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: MAPEAMENTOS_CATEGORIA
-- Descrição: Regras automáticas de categorização
CREATE TABLE mapeamentos_categoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    padrao_descricao VARCHAR(255) NOT NULL,        -- Texto para buscar (ex: "UBER", "IFOOD")
    categoria_despesa_id UUID REFERENCES categorias_despesa(id),
    categoria_receita_id UUID REFERENCES categorias_receita(id),
    tipo_transacao VARCHAR(20) NOT NULL,           -- expense ou income
    vezes_utilizado INTEGER DEFAULT 0,             -- Contador de uso
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. MÓDULO DE CARTÕES DE CRÉDITO
-- =====================================================

-- Tabela: CARTOES_CREDITO
-- Descrição: Cartões de crédito cadastrados
CREATE TABLE cartoes_credito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,                    -- Nome do cartão (Nubank, Inter, etc)
    bandeira VARCHAR(50),                          -- Visa, Mastercard, Elo, etc
    ultimos_digitos VARCHAR(4),                    -- Últimos 4 dígitos
    limite_total NUMERIC(12,2) NOT NULL,           -- Limite de crédito total
    limite_disponivel NUMERIC(12,2),               -- Limite ainda disponível
    saldo_utilizado NUMERIC(12,2) DEFAULT 0,       -- Quanto já foi gasto
    dia_fechamento INTEGER CHECK (dia_fechamento BETWEEN 1 AND 31), -- Dia que fecha a fatura
    dia_vencimento INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31), -- Dia de pagar a fatura
    cor VARCHAR(50),                               -- Cor para exibição
    ativo BOOLEAN DEFAULT TRUE,                    -- Cartão ativo
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: FATURAS_CARTAO
-- Descrição: Faturas mensais dos cartões
CREATE TABLE faturas_cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartao_id UUID NOT NULL REFERENCES cartoes_credito(id) ON DELETE CASCADE,
    mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
    ano_referencia INTEGER NOT NULL,
    valor_total NUMERIC(12,2) DEFAULT 0,           -- Valor total da fatura
    data_fechamento DATE,                          -- Data que fechou
    data_vencimento DATE NOT NULL,                 -- Data para pagar
    status VARCHAR(20) DEFAULT 'aberta',           -- aberta, fechada, paga
    paga_em TIMESTAMP,                             -- Quando foi paga
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. MÓDULO DE DÍVIDAS
-- =====================================================

-- Tabela: CATEGORIAS_DIVIDA
-- Descrição: Tipos de dívidas
CREATE TABLE categorias_divida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,                    -- Empréstimo, Financiamento, etc
    icone VARCHAR(50),
    cor VARCHAR(20)
);

-- Tabela: DIVIDAS
-- Descrição: Dívidas e empréstimos do usuário
CREATE TABLE dividas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias_divida(id),
    credor VARCHAR(255) NOT NULL,                  -- Nome do banco/credor
    valor_original NUMERIC(12,2) NOT NULL,         -- Valor inicial da dívida
    valor_atual NUMERIC(12,2) NOT NULL,            -- Quanto ainda deve
    taxa_juros NUMERIC(5,2),                       -- Taxa de juros mensal (%)
    pagamento_minimo NUMERIC(12,2),                -- Valor mínimo mensal
    data_vencimento DATE,                          -- Próximo vencimento
    prioridade INTEGER DEFAULT 3 CHECK (prioridade BETWEEN 1 AND 5), -- 1=urgente, 5=baixa
    status VARCHAR(20) DEFAULT 'ativa',            -- ativa, paga, negociando, atrasada
    observacoes TEXT,                              -- Notas adicionais
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: PAGAMENTOS_DIVIDA
-- Descrição: Histórico de pagamentos de dívidas
CREATE TABLE pagamentos_divida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    divida_id UUID NOT NULL REFERENCES dividas(id) ON DELETE CASCADE,
    valor NUMERIC(12,2) NOT NULL,                  -- Valor pago
    data_pagamento DATE NOT NULL,                  -- Data do pagamento
    observacoes TEXT,                              -- Notas
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. MÓDULO DE INVESTIMENTOS
-- =====================================================

-- Tabela: TIPOS_INVESTIMENTO
-- Descrição: Tipos/classes de investimentos
CREATE TABLE tipos_investimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,                    -- CDB, Ações, FIIs, Tesouro, etc
    descricao TEXT,                                -- Explicação do tipo
    nivel_risco VARCHAR(20),                       -- baixo, medio, alto
    icone VARCHAR(50),
    cor VARCHAR(20)
);

-- Tabela: INVESTIMENTOS
-- Descrição: Investimentos do usuário
CREATE TABLE investimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_id UUID REFERENCES tipos_investimento(id),
    nome VARCHAR(255) NOT NULL,                    -- Nome do investimento
    instituicao VARCHAR(255),                      -- Banco/corretora
    valor_inicial NUMERIC(14,2) NOT NULL,          -- Valor aplicado inicialmente
    valor_atual NUMERIC(14,2) NOT NULL,            -- Valor atualizado
    rentabilidade_esperada NUMERIC(5,2),           -- % esperada ao ano
    data_inicio DATE NOT NULL,                     -- Quando começou
    data_vencimento DATE,                          -- Quando vence (se aplicável)
    status VARCHAR(20) DEFAULT 'ativo',            -- ativo, resgatado, vencido
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: APORTES_INVESTIMENTO
-- Descrição: Aportes adicionais em investimentos
CREATE TABLE aportes_investimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investimento_id UUID NOT NULL REFERENCES investimentos(id) ON DELETE CASCADE,
    valor NUMERIC(14,2) NOT NULL,                  -- Valor aportado
    data_aporte DATE NOT NULL,                     -- Data do aporte
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. MÓDULO DE METAS FINANCEIRAS
-- =====================================================

-- Tabela: METAS_FINANCEIRAS
-- Descrição: Metas/objetivos financeiros pessoais
CREATE TABLE metas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,                    -- Nome da meta
    categoria VARCHAR(100),                        -- viagem, reserva, compra, etc
    valor_alvo NUMERIC(14,2) NOT NULL,             -- Quanto quer juntar
    valor_atual NUMERIC(14,2) DEFAULT 0,           -- Quanto já tem
    data_alvo DATE,                                -- Prazo para atingir
    status VARCHAR(20) DEFAULT 'ativa',            -- ativa, concluida, cancelada
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. MÓDULO DE APOSTAS
-- =====================================================

-- Tabela: APOSTAS
-- Descrição: Registro de apostas esportivas
CREATE TABLE apostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    plataforma VARCHAR(100),                       -- Bet365, Betano, Pixbet, etc
    valor_apostado NUMERIC(12,2) NOT NULL,         -- Quanto apostou
    valor_ganho NUMERIC(12,2) DEFAULT 0,           -- Quanto ganhou (0 se perdeu)
    data_aposta DATE NOT NULL,                     -- Data da aposta
    observacoes TEXT,                              -- Descrição da aposta
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: ALERTAS_APOSTAS
-- Descrição: Configuração de limites para apostas
CREATE TABLE alertas_apostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    limite_mensal NUMERIC(12,2),                   -- Limite máximo por mês
    alertar_em_percentual INTEGER DEFAULT 80,      -- Alertar quando atingir X%
    ativo BOOLEAN DEFAULT TRUE,                    -- Alerta ativo
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 8. MÓDULO DE PERFIL COMPARTILHADO (CASAL)
-- =====================================================

-- Tabela: PERFIS_COMPARTILHADOS
-- Descrição: Conexão entre dois usuários (casal)
CREATE TABLE perfis_compartilhados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_proprietario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    usuario_parceiro_id UUID REFERENCES usuarios(id),
    email_parceiro VARCHAR(255),                   -- Email do convite
    status VARCHAR(20) DEFAULT 'pending',          -- pending, active, ended
    token_convite VARCHAR(255),                    -- Token único do convite
    convite_expira_em TIMESTAMP,                   -- Validade do convite
    aceito_em TIMESTAMP,                           -- Quando aceitou
    encerrado_em TIMESTAMP,                        -- Quando encerrou
    nivel_casal INTEGER DEFAULT 1,                 -- Nível do casal (1-5)
    pontos_casal INTEGER DEFAULT 0,                -- Pontos acumulados juntos
    sequencia_casal INTEGER DEFAULT 0,             -- Dias consecutivos juntos
    maior_sequencia_casal INTEGER DEFAULT 0,       -- Recorde de dias
    compartilhar_despesas BOOLEAN DEFAULT TRUE,    -- Compartilha despesas
    compartilhar_receitas BOOLEAN DEFAULT FALSE,   -- Compartilha receitas
    compartilhar_metas BOOLEAN DEFAULT TRUE,       -- Compartilha metas
    compartilhar_investimentos BOOLEAN DEFAULT FALSE,
    compartilhar_dividas BOOLEAN DEFAULT FALSE,
    limite_mensal_conjunto NUMERIC(12,2),          -- Limite de gastos juntos
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: METAS_COMPARTILHADAS
-- Descrição: Metas financeiras do casal
CREATE TABLE metas_compartilhadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_compartilhado_id UUID NOT NULL REFERENCES perfis_compartilhados(id) ON DELETE CASCADE,
    criado_por_usuario_id UUID NOT NULL REFERENCES usuarios(id),
    nome VARCHAR(255) NOT NULL,                    -- Nome da meta
    descricao TEXT,                                -- Descrição detalhada
    categoria VARCHAR(100),                        -- viagem, casa, carro, etc
    icone VARCHAR(50),                             -- Ícone representativo
    valor_alvo NUMERIC(14,2) NOT NULL,             -- Valor objetivo
    valor_atual NUMERIC(14,2) DEFAULT 0,           -- Quanto já juntaram
    data_alvo DATE,                                -- Prazo
    tipo_contribuicao VARCHAR(20) DEFAULT 'manual', -- manual ou monthly
    contribuicao_mensal NUMERIC(12,2),             -- Valor mensal automático
    status VARCHAR(20) DEFAULT 'active',           -- active, completed, paused
    pausada BOOLEAN DEFAULT FALSE,                 -- Meta pausada
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: CONTRIBUICOES_META_CASAL
-- Descrição: Aportes nas metas compartilhadas
CREATE TABLE contribuicoes_meta_casal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID NOT NULL REFERENCES metas_compartilhadas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    valor NUMERIC(14,2) NOT NULL,                  -- Valor contribuído
    observacoes TEXT,                              -- Notas
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: DESPESAS_CASAL
-- Descrição: Despesas compartilhadas do casal
CREATE TABLE despesas_casal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_compartilhado_id UUID NOT NULL REFERENCES perfis_compartilhados(id) ON DELETE CASCADE,
    adicionado_por_usuario_id UUID NOT NULL REFERENCES usuarios(id),
    despesa_id UUID REFERENCES despesas(id),       -- FK para despesa original
    descricao VARCHAR(255) NOT NULL,               -- Descrição
    valor NUMERIC(12,2) NOT NULL,                  -- Valor total
    categoria VARCHAR(100),                        -- Categoria
    data_despesa DATE NOT NULL,                    -- Data
    tipo_divisao VARCHAR(20) DEFAULT 'equal',      -- equal ou percentage
    percentual_proprietario NUMERIC(5,2) DEFAULT 50, -- % do proprietário
    percentual_parceiro NUMERIC(5,2) DEFAULT 50,   -- % do parceiro
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: CONQUISTAS_CASAL
-- Descrição: Conquistas desbloqueadas pelo casal
CREATE TABLE conquistas_casal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_compartilhado_id UUID NOT NULL REFERENCES perfis_compartilhados(id) ON DELETE CASCADE,
    tipo_conquista VARCHAR(100) NOT NULL,          -- first_goal, five_goals, etc
    nome VARCHAR(255) NOT NULL,                    -- Nome da conquista
    descricao TEXT,                                -- Descrição
    icone VARCHAR(50),                             -- Ícone
    pontos INTEGER DEFAULT 0,                      -- Pontos ganhos
    conquistado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: ATIVIDADES_CASAL
-- Descrição: Histórico de atividades do casal
CREATE TABLE atividades_casal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_compartilhado_id UUID NOT NULL REFERENCES perfis_compartilhados(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo_atividade VARCHAR(100) NOT NULL,          -- expense, goal_contribution, etc
    titulo VARCHAR(255) NOT NULL,                  -- Título curto
    descricao TEXT,                                -- Descrição detalhada
    dados_extras JSONB,                            -- Metadados em JSON
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: SEQUENCIAS_CASAL
-- Descrição: Registro diário de atividade do casal
CREATE TABLE sequencias_casal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_compartilhado_id UUID NOT NULL REFERENCES perfis_compartilhados(id) ON DELETE CASCADE,
    data_sequencia DATE NOT NULL,                  -- Data do registro
    proprietario_ativo BOOLEAN DEFAULT FALSE,      -- Proprietário registrou
    parceiro_ativo BOOLEAN DEFAULT FALSE,          -- Parceiro registrou
    ambos_ativos BOOLEAN DEFAULT FALSE,            -- Ambos registraram
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(perfil_compartilhado_id, data_sequencia)
);

-- =====================================================
-- 9. MÓDULO DE GAMIFICAÇÃO
-- =====================================================

-- Tabela: CONQUISTAS
-- Descrição: Conquistas disponíveis no sistema
CREATE TABLE conquistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,                    -- Nome da conquista
    descricao TEXT,                                -- Descrição
    tipo_conquista VARCHAR(100) NOT NULL,          -- streak, savings, etc
    icone VARCHAR(50),                             -- Ícone
    pontos INTEGER DEFAULT 0,                      -- Pontos concedidos
    valor_requerido INTEGER,                       -- Meta para desbloquear
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: CONQUISTAS_USUARIO
-- Descrição: Conquistas desbloqueadas pelo usuário
CREATE TABLE conquistas_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conquista_id UUID NOT NULL REFERENCES conquistas(id),
    conquistado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, conquista_id)
);

-- Tabela: DESAFIOS
-- Descrição: Desafios disponíveis no sistema
CREATE TABLE desafios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,                    -- Nome do desafio
    descricao TEXT,                                -- Descrição detalhada
    tipo_desafio VARCHAR(100),                     -- economia, investimento, etc
    valor_alvo NUMERIC(14,2),                      -- Meta a atingir
    categoria_alvo_id UUID REFERENCES categorias_despesa(id), -- Categoria específica
    duracao_dias INTEGER NOT NULL,                 -- Duração em dias
    pontos_recompensa INTEGER DEFAULT 0,           -- Pontos ao completar
    icone VARCHAR(50),                             -- Ícone
    ativo BOOLEAN DEFAULT TRUE,                    -- Desafio disponível
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: DESAFIOS_USUARIO
-- Descrição: Desafios aceitos pelo usuário
CREATE TABLE desafios_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    desafio_id UUID NOT NULL REFERENCES desafios(id),
    status VARCHAR(20) DEFAULT 'in_progress',      -- in_progress, completed, failed
    valor_atual NUMERIC(14,2) DEFAULT 0,           -- Progresso atual
    data_inicio DATE NOT NULL,                     -- Quando começou
    data_fim DATE NOT NULL,                        -- Prazo final
    completado_em TIMESTAMP,                       -- Quando completou
    cancelado_em TIMESTAMP,                        -- Quando cancelou
    pode_tentar_apos TIMESTAMP,                    -- Cooldown para retry
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: SEQUENCIAS_USUARIO
-- Descrição: Controle de sequências (streaks) do usuário
CREATE TABLE sequencias_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_sequencia VARCHAR(50) NOT NULL,           -- daily, weekly
    sequencia_atual INTEGER DEFAULT 0,             -- Dias consecutivos atuais
    maior_sequencia INTEGER DEFAULT 0,             -- Recorde
    data_sequencia DATE,                           -- Data do registro
    ultima_atividade DATE,                         -- Última atividade
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: PONTOS_USUARIO
-- Descrição: Histórico detalhado de pontos
CREATE TABLE pontos_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_acao VARCHAR(100) NOT NULL,               -- Tipo de ação
    pontos INTEGER NOT NULL,                       -- Pontos ganhos/perdidos
    descricao TEXT,                                -- Descrição
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: TRANSACOES_PONTOS
-- Descrição: Registro de ganho/gasto de pontos
CREATE TABLE transacoes_pontos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_transacao VARCHAR(20) NOT NULL,           -- earn, spend
    quantidade INTEGER NOT NULL,                   -- Quantidade de pontos
    origem VARCHAR(100) NOT NULL,                  -- Fonte dos pontos
    origem_id UUID,                                -- ID da fonte
    descricao TEXT,                                -- Descrição
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 10. MÓDULO DE LOJA E INVENTÁRIO
-- =====================================================

-- Tabela: ITENS_LOJA
-- Descrição: Itens disponíveis para compra com pontos
CREATE TABLE itens_loja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,                    -- Nome do item
    descricao TEXT,                                -- Descrição
    tipo_item VARCHAR(50) NOT NULL,                -- theme, border, badge, animation
    preco INTEGER NOT NULL,                        -- Preço em pontos
    imagem_url TEXT,                               -- URL da imagem
    raridade VARCHAR(20) DEFAULT 'common',         -- common, rare, epic, legendary
    nivel_minimo VARCHAR(50),                      -- Nível mínimo requerido
    ativo BOOLEAN DEFAULT TRUE,                    -- Disponível para compra
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: COMPRAS_USUARIO
-- Descrição: Itens comprados pelo usuário
CREATE TABLE compras_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES itens_loja(id),
    comprado_em TIMESTAMP DEFAULT NOW(),
    equipado BOOLEAN DEFAULT FALSE,                -- Item em uso
    UNIQUE(usuario_id, item_id)
);

-- View: INVENTARIO_USUARIO
-- Descrição: Visualização dos itens do usuário
CREATE VIEW inventario_usuario AS
SELECT 
    c.id AS compra_id,
    c.usuario_id,
    c.item_id,
    i.tipo_item,
    i.nome,
    i.descricao,
    i.imagem_url,
    i.raridade,
    i.nivel_minimo,
    i.preco,
    c.equipado,
    c.comprado_em
FROM compras_usuario c
JOIN itens_loja i ON c.item_id = i.id;

-- Tabela: TEMAS_NIVEL
-- Descrição: Temas visuais por nível
CREATE TABLE temas_nivel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nivel_id UUID NOT NULL REFERENCES niveis_usuario(id),
    nome VARCHAR(100) NOT NULL,                    -- Nome do tema
    slug VARCHAR(50) NOT NULL,                     -- Identificador
    variaveis_css JSONB,                           -- Variáveis CSS em JSON
    cores_preview JSONB,                           -- Cores para preview
    tema_padrao BOOLEAN DEFAULT FALSE,             -- É o padrão do nível
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: TEMAS_USUARIO
-- Descrição: Temas desbloqueados pelo usuário
CREATE TABLE temas_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tema_id UUID NOT NULL REFERENCES temas_nivel(id),
    desbloqueado_em TIMESTAMP DEFAULT NOW(),
    ativo BOOLEAN DEFAULT FALSE,                   -- Tema em uso
    UNIQUE(usuario_id, tema_id)
);

-- =====================================================
-- 11. MÓDULO SOCIAL E COMUNIDADE
-- =====================================================

-- Tabela: FEED_SOCIAL
-- Descrição: Posts no feed da comunidade
CREATE TABLE feed_social (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_feed VARCHAR(50) NOT NULL,                -- achievement, milestone, tip
    titulo VARCHAR(255),                           -- Título do post
    descricao TEXT,                                -- Conteúdo
    dados_extras JSONB,                            -- Metadados em JSON
    publico BOOLEAN DEFAULT TRUE,                  -- Post público
    curtidas INTEGER DEFAULT 0,                    -- Contador de likes
    comentarios INTEGER DEFAULT 0,                 -- Contador de comentários
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: CURTIDAS_SOCIAL
-- Descrição: Curtidas em posts
CREATE TABLE curtidas_social (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID NOT NULL REFERENCES feed_social(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(feed_id, usuario_id)
);

-- Tabela: COMENTARIOS_SOCIAL
-- Descrição: Comentários em posts
CREATE TABLE comentarios_social (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID NOT NULL REFERENCES feed_social(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,                        -- Texto do comentário
    aprovado BOOLEAN DEFAULT TRUE,                 -- Moderação
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: DICAS
-- Descrição: Perguntas/dicas da comunidade
CREATE TABLE dicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,                  -- Título da pergunta
    conteudo TEXT NOT NULL,                        -- Conteúdo detalhado
    categoria VARCHAR(100),                        -- Categoria
    visualizacoes INTEGER DEFAULT 0,               -- Contador de views
    marcacoes_util INTEGER DEFAULT 0,              -- Quantos acharam útil
    respondida BOOLEAN DEFAULT FALSE,              -- Tem resposta
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: RESPOSTAS_DICAS
-- Descrição: Respostas às perguntas
CREATE TABLE respostas_dicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dica_id UUID NOT NULL REFERENCES dicas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,                        -- Texto da resposta
    votos_util INTEGER DEFAULT 0,                  -- Votos de "útil"
    marcada_util BOOLEAN DEFAULT FALSE,            -- Marcada como útil pelo autor
    pontos_ganhos INTEGER DEFAULT 0,               -- Pontos ganhos
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: VOTOS_UTEIS
-- Descrição: Votos em respostas úteis
CREATE TABLE votos_uteis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resposta_id UUID NOT NULL REFERENCES respostas_dicas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(resposta_id, usuario_id)
);

-- Tabela: VISITAS_PERFIL
-- Descrição: Registro de visitas a perfis
CREATE TABLE visitas_perfil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    visitado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 12. MÓDULO DE COPILOT (IA)
-- =====================================================

-- Tabela: MENSAGENS_COPILOT
-- Descrição: Histórico de conversas com a IA
CREATE TABLE mensagens_copilot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    papel VARCHAR(20) NOT NULL,                    -- user ou assistant
    conteudo TEXT NOT NULL,                        -- Texto da mensagem
    acao VARCHAR(100),                             -- Ação executada pela IA
    dados_extras JSONB,                            -- Metadados em JSON
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 13. MÓDULO DE IMPORTAÇÃO
-- =====================================================

-- Tabela: HISTORICO_IMPORTACAO
-- Descrição: Log de importações de extratos
CREATE TABLE historico_importacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255),                     -- Nome do arquivo
    tipo_arquivo VARCHAR(20),                      -- csv, xlsx, ofx
    status VARCHAR(20) DEFAULT 'success',          -- success, error, partial
    total_transacoes INTEGER DEFAULT 0,            -- Total de linhas
    transacoes_importadas INTEGER DEFAULT 0,       -- Importadas com sucesso
    duplicatas_ignoradas INTEGER DEFAULT 0,        -- Duplicatas puladas
    total_receitas NUMERIC(14,2) DEFAULT 0,        -- Soma de receitas
    total_despesas NUMERIC(14,2) DEFAULT 0,        -- Soma de despesas
    periodo_inicio DATE,                           -- Início do período
    periodo_fim DATE,                              -- Fim do período
    mensagem_erro TEXT,                            -- Erro se houver
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 14. MÓDULO DE NOTIFICAÇÕES
-- =====================================================

-- Tabela: NOTIFICACOES
-- Descrição: Notificações do sistema para usuários
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,                     -- achievement, alert, reminder, etc
    titulo VARCHAR(255) NOT NULL,                  -- Título
    mensagem TEXT,                                 -- Mensagem completa
    url_acao VARCHAR(255),                         -- Link para ação
    lida BOOLEAN DEFAULT FALSE,                    -- Foi lida
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 15. CONTROLES E LIMITES
-- =====================================================

-- Tabela: LIMITES_DIARIOS
-- Descrição: Controle de limites diários (rate limiting)
CREATE TABLE limites_diarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_limite VARCHAR(100) NOT NULL,             -- Tipo de ação limitada
    data_limite DATE NOT NULL,                     -- Data do limite
    contagem INTEGER DEFAULT 1,                    -- Quantas vezes usou
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, tipo_limite, data_limite)
);

-- Tabela: COOLDOWNS_INTERACAO
-- Descrição: Controle de cooldown entre interações
CREATE TABLE cooldowns_interacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    usuario_alvo_id UUID REFERENCES usuarios(id),  -- Usuário alvo
    alvo_id UUID,                                  -- ID genérico do alvo
    tipo_interacao VARCHAR(100) NOT NULL,          -- Tipo de interação
    criado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices de chaves estrangeiras frequentes
CREATE INDEX idx_despesas_usuario ON despesas(usuario_id);
CREATE INDEX idx_despesas_data ON despesas(data);
CREATE INDEX idx_despesas_categoria ON despesas(categoria_id);
CREATE INDEX idx_receitas_usuario ON receitas(usuario_id);
CREATE INDEX idx_receitas_data ON receitas(data);
CREATE INDEX idx_cartoes_usuario ON cartoes_credito(usuario_id);
CREATE INDEX idx_dividas_usuario ON dividas(usuario_id);
CREATE INDEX idx_investimentos_usuario ON investimentos(usuario_id);
CREATE INDEX idx_apostas_usuario ON apostas(usuario_id);
CREATE INDEX idx_metas_usuario ON metas_financeiras(usuario_id);
CREATE INDEX idx_feed_usuario ON feed_social(usuario_id);
CREATE INDEX idx_dicas_usuario ON dicas(usuario_id);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_mensagens_copilot_usuario ON mensagens_copilot(usuario_id);

-- Índices para buscas frequentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_sessoes_token ON sessoes(token_hash);
CREATE INDEX idx_perfis_compartilhados_status ON perfis_compartilhados(status);

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
