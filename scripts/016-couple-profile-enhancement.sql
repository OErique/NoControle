-- ================================================
-- SCRIPT 016: Couple Profile Enhancement
-- Melhorias no módulo de Perfil Compartilhado (Casal)
-- ================================================

-- Adicionar colunas na tabela shared_profiles
ALTER TABLE shared_profiles 
ADD COLUMN IF NOT EXISTS couple_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS couple_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS couple_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_couple_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_couple_activity DATE,
ADD COLUMN IF NOT EXISTS monthly_limit NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS who_can_create_goals VARCHAR(50) DEFAULT 'both',
ADD COLUMN IF NOT EXISTS who_can_edit_goals VARCHAR(50) DEFAULT 'both',
ADD COLUMN IF NOT EXISTS include_personal_income BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_plan_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- Adicionar colunas na tabela shared_goals
ALTER TABLE shared_goals 
ADD COLUMN IF NOT EXISTS contribution_type VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS contribution_category_id UUID,
ADD COLUMN IF NOT EXISTS monthly_contribution NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'target';

-- Tabela para contribuições de metas do casal
CREATE TABLE IF NOT EXISTS shared_goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES shared_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para despesas compartilhadas detalhadas
CREATE TABLE IF NOT EXISTS couple_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_profile_id UUID NOT NULL REFERENCES shared_profiles(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category VARCHAR(100),
  split_type VARCHAR(50) DEFAULT 'equal',
  owner_percentage NUMERIC(5,2) DEFAULT 50,
  partner_percentage NUMERIC(5,2) DEFAULT 50,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para atividades do casal (timeline)
CREATE TABLE IF NOT EXISTS couple_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_profile_id UUID NOT NULL REFERENCES shared_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para conquistas do casal
CREATE TABLE IF NOT EXISTS couple_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_profile_id UUID NOT NULL REFERENCES shared_profiles(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  points INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shared_profile_id, achievement_type)
);

-- Tabela para streak do casal
CREATE TABLE IF NOT EXISTS couple_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_profile_id UUID NOT NULL REFERENCES shared_profiles(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL DEFAULT CURRENT_DATE,
  owner_active BOOLEAN DEFAULT false,
  partner_active BOOLEAN DEFAULT false,
  both_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shared_profile_id, streak_date)
);

-- Tabela para insights do casal
CREATE TABLE IF NOT EXISTS couple_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_profile_id UUID NOT NULL REFERENCES shared_profiles(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_couple_expenses_profile ON couple_expenses(shared_profile_id);
CREATE INDEX IF NOT EXISTS idx_couple_expenses_date ON couple_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_couple_activities_profile ON couple_activities(shared_profile_id);
CREATE INDEX IF NOT EXISTS idx_couple_activities_date ON couple_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_goal_contributions_goal ON shared_goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_couple_streaks_profile ON couple_streaks(shared_profile_id);

-- Inserir conquistas padrão do casal
INSERT INTO achievements (achievement_type, name, description, icon, points, requirement_value) VALUES
('couple_first_goal', 'Primeira Meta Juntos', 'Criaram a primeira meta do casal', 'target', 50, 1),
('couple_first_expense', 'Dividindo Contas', 'Registraram a primeira despesa compartilhada', 'receipt', 25, 1),
('couple_30_days', '30 Dias Juntos', 'Completaram 30 dias usando o perfil compartilhado', 'calendar', 100, 30),
('couple_90_days', '90 Dias Juntos', 'Completaram 90 dias usando o perfil compartilhado', 'calendar-check', 200, 90),
('couple_goal_complete', 'Sonho Realizado', 'Completaram uma meta do casal', 'trophy', 150, 1),
('couple_streak_7', 'Semana Perfeita', 'Mantiveram 7 dias de sequência juntos', 'flame', 75, 7),
('couple_streak_30', 'Mês Perfeito', 'Mantiveram 30 dias de sequência juntos', 'fire', 200, 30),
('couple_savings_1000', 'Mil Economizados', 'Economizaram R$ 1.000 juntos', 'piggy-bank', 100, 1000),
('couple_savings_5000', '5 Mil Economizados', 'Economizaram R$ 5.000 juntos', 'trending-up', 250, 5000)
ON CONFLICT DO NOTHING;
