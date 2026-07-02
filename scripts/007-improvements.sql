-- Improvements and new features
-- Add credit card support

-- Credit cards table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    last_digits VARCHAR(4),
    brand VARCHAR(50), -- Visa, Mastercard, etc
    credit_limit DECIMAL(12,2),
    closing_day INTEGER, -- 1-31
    due_day INTEGER, -- 1-31
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add credit card columns to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS total_installments INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS installment_group_id UUID;

-- Add imported_hash to track imported transactions and avoid reimporting
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS import_hash VARCHAR(64);
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS import_hash VARCHAR(64);

-- Create unique index on import_hash to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_import_hash ON expenses(user_id, import_hash) WHERE import_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_incomes_import_hash ON incomes(user_id, import_hash) WHERE import_hash IS NOT NULL;

-- Theme preference for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'dark';

-- Add more challenges
INSERT INTO challenges (name, description, challenge_type, target_value, duration_days, reward_points, icon) VALUES
('Meta de Economia', 'Economize R$ 500 este mês', 'save_amount', 500, 30, 250, 'piggy-bank'),
('Controle Diário', 'Registre transações por 14 dias seguidos', 'streak', 14, 14, 200, 'calendar-check'),
('Corte no Supérfluo', 'Reduza gastos com lazer em 30%', 'reduce_expense', 30, 30, 220, 'scissors'),
('Semana sem Uber', 'Passe 7 dias sem usar transporte por app', 'no_category_spend', NULL, 7, 120, 'car'),
('Mestre do Orçamento', 'Fique dentro do orçamento por 30 dias', 'budget_master', 30, 30, 350, 'target'),
('Investidor Iniciante', 'Faça seu primeiro aporte do mês', 'invest', 1, 30, 150, 'trending-up'),
('Sem Delivery por 2 Semanas', 'Fique 14 dias sem pedir delivery', 'no_category_spend', NULL, 14, 200, 'utensils'),
('Pagador de Dívidas', 'Pague R$ 1000 em dívidas este mês', 'pay_debt_amount', 1000, 30, 300, 'credit-card')
ON CONFLICT DO NOTHING;

-- Create indexes for credit cards
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_credit_card ON expenses(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_expenses_installment_group ON expenses(installment_group_id);
