-- Seed initial data
-- Safe to run multiple times (uses ON CONFLICT)

-- Insert default plans
INSERT INTO plans (name, slug, description, price, modules_allowed, features) VALUES
('Essencial', 'essencial', 'Acesso a 1 módulo de sua escolha', 0, 1, '["1 módulo", "Dashboard básico", "Suporte por email"]'),
('Completo', 'completo', 'Acesso a 2 módulos de sua escolha', 29.90, 2, '["2 módulos", "Dashboard completo", "Relatórios mensais", "Suporte prioritário"]'),
('Total', 'total', 'Acesso completo a todos os módulos', 49.90, 3, '["Todos os módulos", "Dashboard premium", "Relatórios avançados", "Simulações ilimitadas", "Suporte VIP"]')
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    modules_allowed = EXCLUDED.modules_allowed,
    features = EXCLUDED.features;

-- Insert default debt categories
INSERT INTO debt_categories (name, icon, color) VALUES
('Cartão de Crédito', 'credit-card', '#ef4444'),
('Empréstimo Pessoal', 'banknote', '#f97316'),
('Financiamento', 'home', '#eab308'),
('Cheque Especial', 'alert-circle', '#dc2626'),
('Outros', 'more-horizontal', '#6b7280')
ON CONFLICT DO NOTHING;

-- Insert default expense categories
INSERT INTO expense_categories (name, icon, color, is_default) VALUES
('Moradia', 'home', '#3b82f6', true),
('Alimentação', 'utensils', '#22c55e', true),
('Transporte', 'car', '#f59e0b', true),
('Saúde', 'heart', '#ef4444', true),
('Educação', 'book', '#8b5cf6', true),
('Lazer', 'gamepad-2', '#ec4899', true),
('Vestuário', 'shirt', '#06b6d4', true),
('Outros', 'more-horizontal', '#6b7280', true)
ON CONFLICT DO NOTHING;

-- Insert default income categories
INSERT INTO income_categories (name, icon, color, is_default) VALUES
('Salário', 'briefcase', '#22c55e', true),
('Freelance', 'laptop', '#3b82f6', true),
('Investimentos', 'trending-up', '#8b5cf6', true),
('Aluguel', 'home', '#f59e0b', true),
('Outros', 'more-horizontal', '#6b7280', true)
ON CONFLICT DO NOTHING;

-- Insert investment types
INSERT INTO investment_types (name, description, risk_level, icon, color) VALUES
('Tesouro Direto', 'Títulos públicos do governo federal', 'low', 'shield', '#22c55e'),
('CDB', 'Certificado de Depósito Bancário', 'low', 'landmark', '#3b82f6'),
('LCI/LCA', 'Letras de Crédito Imobiliário/Agronegócio', 'low', 'building', '#06b6d4'),
('Fundos de Investimento', 'Fundos diversos geridos por gestoras', 'medium', 'pie-chart', '#f59e0b'),
('Ações', 'Renda variável - Bolsa de Valores', 'high', 'trending-up', '#ef4444'),
('FIIs', 'Fundos de Investimento Imobiliário', 'medium', 'building-2', '#8b5cf6'),
('Criptomoedas', 'Ativos digitais', 'high', 'bitcoin', '#f97316'),
('Poupança', 'Caderneta de poupança', 'low', 'piggy-bank', '#10b981')
ON CONFLICT DO NOTHING;
