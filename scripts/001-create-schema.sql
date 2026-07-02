-- Personal Finance SaaS Database Schema
-- Run this script to create all necessary tables
-- Safe to run multiple times (idempotent)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    modules_allowed INTEGER NOT NULL DEFAULT 1,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    monthly_income DECIMAL(12,2),
    has_debts BOOLEAN DEFAULT false,
    main_goal VARCHAR(50),
    onboarding_completed BOOLEAN DEFAULT false,
    plan_id UUID REFERENCES plans(id),
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for JWT token management
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Debt categories
CREATE TABLE IF NOT EXISTS debt_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Debts table (Module 1 - Sair do Vermelho)
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES debt_categories(id),
    creditor VARCHAR(200) NOT NULL,
    original_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    due_date DATE,
    minimum_payment DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active',
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Debt payments tracking
CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Income categories
CREATE TABLE IF NOT EXISTS income_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Incomes table (Module 2 - Controle Financeiro)
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES income_categories(id),
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table (Module 2 - Controle Financeiro)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id),
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investment types
CREATE TABLE IF NOT EXISTS investment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    risk_level VARCHAR(20),
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investments table (Module 3 - Investimentos)
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type_id UUID REFERENCES investment_types(id),
    name VARCHAR(200) NOT NULL,
    institution VARCHAR(200),
    initial_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL,
    expected_return DECIMAL(5,2),
    start_date DATE NOT NULL,
    maturity_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investment contributions
CREATE TABLE IF NOT EXISTS investment_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    contribution_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial goals
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    target_date DATE,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, streak_date)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes (with IF NOT EXISTS via DO block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_debts_user_id') THEN
        CREATE INDEX idx_debts_user_id ON debts(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_debts_status') THEN
        CREATE INDEX idx_debts_status ON debts(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_incomes_user_id') THEN
        CREATE INDEX idx_incomes_user_id ON incomes(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_incomes_date') THEN
        CREATE INDEX idx_incomes_date ON incomes(date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_expenses_user_id') THEN
        CREATE INDEX idx_expenses_user_id ON expenses(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_expenses_date') THEN
        CREATE INDEX idx_expenses_date ON expenses(date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_investments_user_id') THEN
        CREATE INDEX idx_investments_user_id ON investments(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_user_id') THEN
        CREATE INDEX idx_sessions_user_id ON sessions(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_token') THEN
        CREATE INDEX idx_sessions_token ON sessions(token_hash);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_streaks_user_date') THEN
        CREATE INDEX idx_user_streaks_user_date ON user_streaks(user_id, streak_date DESC);
    END IF;
END$$;
