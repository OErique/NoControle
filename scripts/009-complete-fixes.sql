-- =============================================
-- Script 009: Complete Fixes and Anti-Abuse System
-- =============================================

-- 1. Add anti-abuse tracking columns to social tables
ALTER TABLE social_likes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Create table to track interaction cooldowns
CREATE TABLE IF NOT EXISTS interaction_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'tip_response'
  target_id UUID, -- feed_id, comment_id, tip_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, interaction_type, target_id)
);

-- 3. Create points transaction log for auditing
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'bonus', 'penalty'
  source VARCHAR(100) NOT NULL, -- 'like_received', 'comment_received', 'challenge_complete', 'shop_purchase'
  source_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add daily limits table
CREATE TABLE IF NOT EXISTS daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  limit_type VARCHAR(50) NOT NULL, -- 'likes_given', 'comments_given', 'tips_answered'
  count INTEGER DEFAULT 0,
  limit_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, limit_type, limit_date)
);

-- 5. Create shop items table
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL, -- 'border', 'theme', 'badge', 'animation'
  price INTEGER NOT NULL,
  image_url TEXT,
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  is_active BOOLEAN DEFAULT true,
  min_level VARCHAR(20), -- minimum level required
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create user purchases table
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_id)
);

-- 7. Add profile customization columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_border_id UUID REFERENCES shop_items(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_theme_id UUID REFERENCES shop_items(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'dark';

-- 8. Add more challenge variety
INSERT INTO challenges (name, description, challenge_type, target_value, duration_days, reward_points, icon, is_active)
SELECT name, description, challenge_type, target_value, duration_days, reward_points, icon, is_active
FROM (VALUES
  ('Economista Iniciante', 'Registre 10 despesas este mês', 'register_expenses', 10, 30, 50, 'receipt', true),
  ('Investidor Consciente', 'Adicione 3 investimentos diferentes', 'add_investments', 3, 30, 100, 'trending-up', true),
  ('Caçador de Dívidas', 'Quite uma dívida completamente', 'pay_debt', 1, 30, 150, 'check-circle', true),
  ('Mestre do Orçamento', 'Fique dentro do orçamento por 14 dias', 'budget_streak', 14, 30, 200, 'target', true),
  ('Poupador Dedicado', 'Economize 20% da sua renda este mês', 'save_percentage', 20, 30, 250, 'piggy-bank', true),
  ('Organizador Financeiro', 'Categorize 50 transações', 'categorize_transactions', 50, 30, 75, 'folder', true),
  ('Sem Gastos Supérfluos', 'Não gaste em lazer por 7 dias', 'no_category_expense', 7, 7, 100, 'ban', true),
  ('Primeiros Passos', 'Complete o onboarding e configure seu perfil', 'complete_profile', 1, 7, 25, 'user-check', true)
) AS new_challenges(name, description, challenge_type, target_value, duration_days, reward_points, icon, is_active)
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE challenges.name = new_challenges.name);

-- 9. Insert shop items
INSERT INTO shop_items (name, description, item_type, price, rarity, min_level)
SELECT name, description, item_type, price, rarity, min_level
FROM (VALUES
  ('Borda Dourada', 'Uma borda dourada brilhante para seu perfil', 'border', 500, 'rare', 'prata'),
  ('Borda Arco-Íris', 'Borda animada com cores do arco-íris', 'border', 1000, 'epic', 'ouro'),
  ('Borda Diamante', 'A borda mais exclusiva e cintilante', 'border', 2500, 'legendary', 'diamante'),
  ('Borda Neon', 'Efeito neon pulsante', 'border', 750, 'rare', 'prata'),
  ('Borda Fogo', 'Animação de chamas ao redor do perfil', 'border', 1500, 'epic', 'ouro'),
  ('Tema Midnight', 'Tema escuro premium com detalhes roxos', 'theme', 300, 'common', 'bronze'),
  ('Tema Sunset', 'Gradientes quentes de laranja e rosa', 'theme', 500, 'rare', 'prata'),
  ('Tema Ocean', 'Tons de azul e verde água', 'theme', 500, 'rare', 'prata'),
  ('Badge Investidor', 'Mostra que você é um investidor ativo', 'badge', 200, 'common', 'bronze'),
  ('Badge Economista', 'Para quem economiza consistentemente', 'badge', 200, 'common', 'bronze'),
  ('Animação Moedas', 'Moedas caindo quando você ganha pontos', 'animation', 800, 'rare', 'prata'),
  ('Animação Foguete', 'Foguete subindo ao completar desafios', 'animation', 800, 'rare', 'prata')
) AS items(name, description, item_type, price, rarity, min_level)
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE shop_items.name = items.name);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interaction_cooldowns_user ON interaction_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON daily_limits(user_id, limit_date);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON user_purchases(user_id);
