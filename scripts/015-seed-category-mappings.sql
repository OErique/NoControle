-- Função para criar mapeamentos de categorias padrão para um usuário
-- Uso: SELECT create_default_category_mappings('seu-user-id-aqui');

CREATE OR REPLACE FUNCTION create_default_category_mappings(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_alimentacao_id UUID;
    v_transporte_id UUID;
    v_moradia_id UUID;
    v_saude_id UUID;
    v_educacao_id UUID;
    v_lazer_id UUID;
    v_compras_id UUID;
    v_servicos_id UUID;
    v_outros_id UUID;
    v_salario_id UUID;
    v_freelance_id UUID;
    v_investimentos_id UUID;
    v_outros_receita_id UUID;
BEGIN
    -- Buscar IDs das categorias de despesas do usuário ou padrão
    SELECT id INTO v_alimentacao_id FROM expense_categories WHERE LOWER(name) LIKE '%alimenta%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_transporte_id FROM expense_categories WHERE LOWER(name) LIKE '%transporte%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_moradia_id FROM expense_categories WHERE LOWER(name) LIKE '%moradia%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_saude_id FROM expense_categories WHERE LOWER(name) LIKE '%sa%de%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_educacao_id FROM expense_categories WHERE LOWER(name) LIKE '%educa%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_lazer_id FROM expense_categories WHERE LOWER(name) LIKE '%lazer%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_compras_id FROM expense_categories WHERE LOWER(name) LIKE '%compras%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_servicos_id FROM expense_categories WHERE LOWER(name) LIKE '%servi%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_outros_id FROM expense_categories WHERE LOWER(name) LIKE '%outros%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;

    -- Buscar IDs das categorias de receitas
    SELECT id INTO v_salario_id FROM income_categories WHERE LOWER(name) LIKE '%sal%rio%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_freelance_id FROM income_categories WHERE LOWER(name) LIKE '%freelance%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_investimentos_id FROM income_categories WHERE LOWER(name) LIKE '%investimento%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;
    SELECT id INTO v_outros_receita_id FROM income_categories WHERE LOWER(name) LIKE '%outros%' AND (user_id = p_user_id OR user_id IS NULL OR is_default = true) ORDER BY user_id NULLS LAST LIMIT 1;

    -- Fallbacks
    IF v_alimentacao_id IS NULL THEN SELECT id INTO v_alimentacao_id FROM expense_categories LIMIT 1; END IF;
    IF v_transporte_id IS NULL THEN v_transporte_id := v_alimentacao_id; END IF;
    IF v_moradia_id IS NULL THEN v_moradia_id := v_alimentacao_id; END IF;
    IF v_saude_id IS NULL THEN v_saude_id := v_alimentacao_id; END IF;
    IF v_educacao_id IS NULL THEN v_educacao_id := v_alimentacao_id; END IF;
    IF v_lazer_id IS NULL THEN v_lazer_id := v_alimentacao_id; END IF;
    IF v_compras_id IS NULL THEN v_compras_id := v_alimentacao_id; END IF;
    IF v_servicos_id IS NULL THEN v_servicos_id := v_alimentacao_id; END IF;
    IF v_outros_id IS NULL THEN v_outros_id := v_alimentacao_id; END IF;
    IF v_salario_id IS NULL THEN SELECT id INTO v_salario_id FROM income_categories LIMIT 1; END IF;
    IF v_freelance_id IS NULL THEN v_freelance_id := v_salario_id; END IF;
    IF v_investimentos_id IS NULL THEN v_investimentos_id := v_salario_id; END IF;
    IF v_outros_receita_id IS NULL THEN v_outros_receita_id := v_salario_id; END IF;

    -- Limpar mapeamentos antigos do usuário
    DELETE FROM category_mappings WHERE user_id = p_user_id;

    -- ALIMENTAÇÃO
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'ifood', v_alimentacao_id, 'expense', 100, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'rappi', v_alimentacao_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'uber eats', v_alimentacao_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'restaurante', v_alimentacao_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'supermercado', v_alimentacao_id, 'expense', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'mercado', v_alimentacao_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'carrefour', v_alimentacao_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'pao de acucar', v_alimentacao_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'assai', v_alimentacao_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'atacadao', v_alimentacao_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'padaria', v_alimentacao_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'cafe', v_alimentacao_id, 'expense', 60, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'mcdonalds', v_alimentacao_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'burger king', v_alimentacao_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'pizza', v_alimentacao_id, 'expense', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'acougue', v_alimentacao_id, 'expense', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'hortifruti', v_alimentacao_id, 'expense', 70, NOW(), NOW());

    -- TRANSPORTE
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'uber', v_transporte_id, 'expense', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, '99', v_transporte_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'gasolina', v_transporte_id, 'expense', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'combustivel', v_transporte_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'posto', v_transporte_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'shell', v_transporte_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'ipiranga', v_transporte_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'estacionamento', v_transporte_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'pedagio', v_transporte_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'sem parar', v_transporte_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'metro', v_transporte_id, 'expense', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'onibus', v_transporte_id, 'expense', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'bilhete unico', v_transporte_id, 'expense', 75, NOW(), NOW());

    -- MORADIA
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'aluguel', v_moradia_id, 'expense', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'condominio', v_moradia_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'iptu', v_moradia_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'luz', v_moradia_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'enel', v_moradia_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'energia', v_moradia_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'agua', v_moradia_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'sabesp', v_moradia_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'gas', v_moradia_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'internet', v_moradia_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'vivo', v_moradia_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'claro', v_moradia_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'tim', v_moradia_id, 'expense', 80, NOW(), NOW());

    -- SAÚDE
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'farmacia', v_saude_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'drogaria', v_saude_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'drogasil', v_saude_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'medico', v_saude_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'consulta', v_saude_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'hospital', v_saude_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'dentista', v_saude_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'plano de saude', v_saude_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'unimed', v_saude_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'academia', v_saude_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'smart fit', v_saude_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'gympass', v_saude_id, 'expense', 80, NOW(), NOW());

    -- EDUCAÇÃO
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'escola', v_educacao_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'faculdade', v_educacao_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'curso', v_educacao_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'livro', v_educacao_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'udemy', v_educacao_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'alura', v_educacao_id, 'expense', 80, NOW(), NOW());

    -- LAZER
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'netflix', v_lazer_id, 'expense', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'spotify', v_lazer_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'disney', v_lazer_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'hbo', v_lazer_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'amazon prime', v_lazer_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'youtube', v_lazer_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'cinema', v_lazer_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'viagem', v_lazer_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'hotel', v_lazer_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'airbnb', v_lazer_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'steam', v_lazer_id, 'expense', 75, NOW(), NOW());

    -- COMPRAS
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'amazon', v_compras_id, 'expense', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'mercado livre', v_compras_id, 'expense', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'magalu', v_compras_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'americanas', v_compras_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'casas bahia', v_compras_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'shopee', v_compras_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'shein', v_compras_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'aliexpress', v_compras_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'renner', v_compras_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'riachuelo', v_compras_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'cea', v_compras_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'zara', v_compras_id, 'expense', 75, NOW(), NOW());

    -- SERVIÇOS
    INSERT INTO category_mappings (id, user_id, description_pattern, category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'tarifa', v_servicos_id, 'expense', 90, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'seguro', v_servicos_id, 'expense', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'assinatura', v_servicos_id, 'expense', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'mensalidade', v_servicos_id, 'expense', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'iof', v_servicos_id, 'expense', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'anuidade', v_servicos_id, 'expense', 75, NOW(), NOW());

    -- RECEITAS
    INSERT INTO category_mappings (id, user_id, description_pattern, income_category_id, transaction_type, usage_count, created_at, updated_at) VALUES
    (gen_random_uuid(), p_user_id, 'salario', v_salario_id, 'income', 95, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'pagamento', v_salario_id, 'income', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'deposito', v_salario_id, 'income', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'transferencia recebida', v_salario_id, 'income', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'pix recebido', v_salario_id, 'income', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'freelance', v_freelance_id, 'income', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'projeto', v_freelance_id, 'income', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'dividendo', v_investimentos_id, 'income', 85, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'rendimento', v_investimentos_id, 'income', 80, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'juros', v_investimentos_id, 'income', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'resgate', v_investimentos_id, 'income', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'reembolso', v_outros_receita_id, 'income', 75, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'cashback', v_outros_receita_id, 'income', 70, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'premio', v_outros_receita_id, 'income', 65, NOW(), NOW()),
    (gen_random_uuid(), p_user_id, 'bonus', v_salario_id, 'income', 80, NOW(), NOW());

END;
$$ LANGUAGE plpgsql;

-- Agora vamos criar os mapeamentos para todos os usuários existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM users LOOP
        PERFORM create_default_category_mappings(r.id);
    END LOOP;
END $$;
