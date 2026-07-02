-- Gamification tables for streaks, challenges, and achievements
-- Run this script after the main schema

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- 'daily_login', 'daily_register', 'no_expense_day'
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, streak_type)
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) NOT NULL, -- 'reduce_expense', 'save_amount', 'no_category_spend', 'pay_debt'
    target_value DECIMAL(12,2),
    target_category_id UUID,
    duration_days INTEGER DEFAULT 30,
    reward_points INTEGER DEFAULT 100,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User challenges participation
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    current_value DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'cancelled'
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id, start_date)
);

-- User achievements/badges
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    points INTEGER DEFAULT 50,
    achievement_type VARCHAR(50), -- 'streak', 'debt_paid', 'savings_goal', 'first_steps'
    requirement_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- User points/score history
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'challenge_complete', 'achievement', 'streak_bonus', 'debt_paid'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add gamification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_score INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- Seed default challenges
INSERT INTO challenges (name, description, challenge_type, target_value, duration_days, reward_points, icon) VALUES
('Semana sem Delivery', 'Passe 7 dias sem gastar com delivery ou fast food', 'no_category_spend', NULL, 7, 150, 'utensils'),
('Economize R$ 200', 'Economize R$ 200 este mês comparado ao mês anterior', 'save_amount', 200, 30, 200, 'piggy-bank'),
('Reduza Lazer em 20%', 'Reduza seus gastos com lazer em 20% este mês', 'reduce_expense', 20, 30, 180, 'film'),
('Quite uma Dívida', 'Quite completamente uma de suas dívidas', 'pay_debt', 1, 30, 300, 'check-circle'),
('7 Dias Registrando', 'Registre suas transações por 7 dias seguidos', 'streak', 7, 7, 100, 'calendar-check')
ON CONFLICT DO NOTHING;

-- Seed default achievements
INSERT INTO achievements (name, description, icon, points, achievement_type, requirement_value) VALUES
('Primeiro Passo', 'Completou o onboarding e configurou seu perfil', 'footprints', 50, 'first_steps', 1),
('Streak de 7 Dias', 'Registrou transações por 7 dias seguidos', 'flame', 100, 'streak', 7),
('Streak de 30 Dias', 'Registrou transações por 30 dias seguidos', 'fire', 300, 'streak', 30),
('Primeira Dívida Quitada', 'Quitou sua primeira dívida completamente', 'trophy', 200, 'debt_paid', 1),
('Livre de Dívidas', 'Quitou todas as suas dívidas', 'crown', 500, 'debt_paid', 0),
('Primeiro Investimento', 'Fez seu primeiro investimento', 'trending-up', 150, 'first_steps', 1),
('Meta Batida', 'Alcançou uma meta financeira', 'target', 200, 'savings_goal', 1),
('Desafio Completo', 'Completou seu primeiro desafio', 'award', 100, 'challenge', 1)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
