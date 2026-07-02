-- Import history and category mapping tables for bank statement import

-- Import history table
CREATE TABLE import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- 'csv', 'xlsx', 'pdf', 'ofx', 'bbt', 'txt'
    total_transactions INTEGER NOT NULL DEFAULT 0,
    imported_transactions INTEGER NOT NULL DEFAULT 0,
    skipped_duplicates INTEGER NOT NULL DEFAULT 0,
    total_income DECIMAL(12,2) DEFAULT 0,
    total_expense DECIMAL(12,2) DEFAULT 0,
    period_start DATE,
    period_end DATE,
    status VARCHAR(20) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Category mapping for automatic categorization learning
CREATE TABLE category_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description_pattern VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES expense_categories(id),
    income_category_id UUID REFERENCES income_categories(id),
    transaction_type VARCHAR(10) NOT NULL, -- 'income' or 'expense'
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, description_pattern, transaction_type)
);

-- Indexes
CREATE INDEX idx_import_history_user_id ON import_history(user_id);
CREATE INDEX idx_category_mappings_user_id ON category_mappings(user_id);
CREATE INDEX idx_category_mappings_pattern ON category_mappings(description_pattern);
