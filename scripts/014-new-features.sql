-- =====================================================
-- NOVAS FUNCIONALIDADES - TERMOS, APOSTAS, CARTOES, PERFIL COMPARTILHADO
-- =====================================================

-- 1. Adicionar campo de aceite de termos na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gambling_enabled BOOLEAN DEFAULT FALSE;

-- 2. Criar tabela de apostas/jogos de azar
CREATE TABLE IF NOT EXISTS gambling_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_bet NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_won NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gambling_bets_user_id ON gambling_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_gambling_bets_date ON gambling_bets(bet_date);

-- 3. Criar tabela de alertas de apostas
CREATE TABLE IF NOT EXISTS gambling_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(12,2) DEFAULT 500,
  alert_at_percentage INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de perfil compartilhado (cônjuge)
CREATE TABLE IF NOT EXISTS shared_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  partner_email VARCHAR(255),
  invite_token VARCHAR(255),
  invite_expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
  share_expenses BOOLEAN DEFAULT TRUE,
  share_incomes BOOLEAN DEFAULT TRUE,
  share_debts BOOLEAN DEFAULT FALSE,
  share_investments BOOLEAN DEFAULT FALSE,
  share_goals BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_shared_profiles_owner ON shared_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_profiles_partner ON shared_profiles(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_profiles_token ON shared_profiles(invite_token);

-- 5. Criar tabela de despesas compartilhadas
CREATE TABLE IF NOT EXISTS shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_profile_id UUID NOT NULL REFERENCES shared_profiles(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  split_percentage NUMERIC(5,2) DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela de metas compartilhadas
CREATE TABLE IF NOT EXISTS shared_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_profile_id UUID NOT NULL REFERENCES shared_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0,
  target_date DATE,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Adicionar campos de cartão de crédito que podem estar faltando
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS current_balance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS available_limit NUMERIC(12,2);

-- Atualizar limite disponível baseado no limite e saldo
UPDATE credit_cards SET available_limit = credit_limit - COALESCE(current_balance, 0) WHERE available_limit IS NULL;

-- 8. Criar tabela de faturas de cartão
CREATE TABLE IF NOT EXISTS credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  reference_month INTEGER NOT NULL,
  reference_year INTEGER NOT NULL,
  total_amount NUMERIC(12,2) DEFAULT 0,
  due_date DATE,
  closing_date DATE,
  status VARCHAR(50) DEFAULT 'open', -- open, closed, paid, overdue
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(credit_card_id, reference_month, reference_year)
);

-- 9. Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_expenses_credit_card ON expenses(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_expenses_installment ON expenses(installment_group_id);

-- 10. Seed de novos desafios de gamificação
INSERT INTO challenges (id, name, description, challenge_type, target_value, duration_days, reward_points, icon, is_active)
VALUES 
  (gen_random_uuid(), '7 Dias Sem Apostar', 'Fique 7 dias sem registrar nenhuma aposta', 'no_gambling', 7, 7, 200, 'shield', true),
  (gen_random_uuid(), '30 Dias Consciente', 'Registre todas as suas apostas por 30 dias', 'gambling_tracking', 30, 30, 300, 'eye', true),
  (gen_random_uuid(), 'Economista', 'Gaste menos que o mês anterior', 'reduce_spending', 1, 30, 250, 'trending-down', true),
  (gen_random_uuid(), 'Cartão Controlado', 'Use menos de 30% do limite do cartão', 'card_usage', 30, 30, 200, 'credit-card', true),
  (gen_random_uuid(), 'Registrador Fiel', 'Registre transações por 14 dias seguidos', 'daily_tracking', 14, 14, 150, 'calendar-check', true)
ON CONFLICT DO NOTHING;
