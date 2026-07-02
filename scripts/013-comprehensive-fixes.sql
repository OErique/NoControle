-- Script de correções abrangentes
-- Adiciona colunas faltantes e corrige estruturas

-- 1. Adicionar colunas faltantes na tabela user_challenges
ALTER TABLE user_challenges 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS can_retry_after TIMESTAMP WITH TIME ZONE;

-- 2. Garantir que a coluna points existe na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- 3. Atualizar total_points baseado em points existentes
UPDATE users SET total_points = COALESCE(points, 0) WHERE total_points IS NULL OR total_points = 0;

-- debt_categories NÃO tem user_id, remover essa condição
-- 4. Remover categorias duplicadas em debt_categories (não tem user_id)
DO $$
DECLARE
    dup_record RECORD;
    keep_id UUID;
BEGIN
    FOR dup_record IN 
        SELECT LOWER(TRIM(name)) as norm_name, COUNT(*) as cnt
        FROM debt_categories 
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        SELECT id INTO keep_id 
        FROM debt_categories 
        WHERE LOWER(TRIM(name)) = dup_record.norm_name
        ORDER BY created_at ASC, id::text ASC
        LIMIT 1;
        
        UPDATE debts SET category_id = keep_id 
        WHERE category_id IN (
            SELECT id FROM debt_categories 
            WHERE LOWER(TRIM(name)) = dup_record.norm_name 
            AND id != keep_id
        );
        
        DELETE FROM debt_categories 
        WHERE LOWER(TRIM(name)) = dup_record.norm_name 
        AND id != keep_id;
    END LOOP;
END $$;

-- expense_categories tem user_id, agrupar por (user_id, name)
-- 5. Remover categorias duplicadas em expense_categories
DO $$
DECLARE
    dup_record RECORD;
    keep_id UUID;
BEGIN
    FOR dup_record IN 
        SELECT user_id, LOWER(TRIM(name)) as norm_name, COUNT(*) as cnt
        FROM expense_categories 
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        SELECT id INTO keep_id 
        FROM expense_categories 
        WHERE LOWER(TRIM(name)) = dup_record.norm_name 
        AND (user_id = dup_record.user_id OR (user_id IS NULL AND dup_record.user_id IS NULL))
        ORDER BY created_at ASC, id::text ASC
        LIMIT 1;
        
        UPDATE expenses SET category_id = keep_id 
        WHERE category_id IN (
            SELECT id FROM expense_categories 
            WHERE LOWER(TRIM(name)) = dup_record.norm_name 
            AND (user_id = dup_record.user_id OR (user_id IS NULL AND dup_record.user_id IS NULL))
            AND id != keep_id
        );
        
        DELETE FROM expense_categories 
        WHERE LOWER(TRIM(name)) = dup_record.norm_name 
        AND (user_id = dup_record.user_id OR (user_id IS NULL AND dup_record.user_id IS NULL))
        AND id != keep_id;
    END LOOP;
END $$;

-- income_categories tem user_id, agrupar por (user_id, name)
-- 6. Remover categorias duplicadas em income_categories
DO $$
DECLARE
    dup_record RECORD;
    keep_id UUID;
BEGIN
    FOR dup_record IN 
        SELECT user_id, LOWER(TRIM(name)) as norm_name, COUNT(*) as cnt
        FROM income_categories 
        GROUP BY user_id, LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    LOOP
        SELECT id INTO keep_id 
        FROM income_categories 
        WHERE LOWER(TRIM(name)) = dup_record.norm_name 
        AND (user_id = dup_record.user_id OR (user_id IS NULL AND dup_record.user_id IS NULL))
        ORDER BY created_at ASC, id::text ASC
        LIMIT 1;
        
        UPDATE incomes SET category_id = keep_id 
        WHERE category_id IN (
            SELECT id FROM income_categories 
            WHERE LOWER(TRIM(name)) = dup_record.norm_name 
            AND (user_id = dup_record.user_id OR (user_id IS NULL AND dup_record.user_id IS NULL))
            AND id != keep_id
        );
        
        DELETE FROM income_categories 
        WHERE LOWER(TRIM(name)) = dup_record.norm_name 
        AND (user_id = dup_record.user_id OR (user_id IS NULL AND dup_record.user_id IS NULL))
        AND id != keep_id;
    END LOOP;
END $$;

-- 7. Adicionar itens padrão na loja se não existirem
INSERT INTO shop_items (id, name, description, item_type, price, rarity, min_level, is_active, image_url)
VALUES 
    (gen_random_uuid(), 'Borda Dourada', 'Uma borda dourada elegante para seu perfil', 'border', 500, 'rare', 'silver', true, '/borders/gold.png'),
    (gen_random_uuid(), 'Borda Arco-íris', 'Borda animada com cores do arco-íris', 'border', 1000, 'epic', 'gold', true, '/borders/rainbow.png'),
    (gen_random_uuid(), 'Badge Estrela', 'Badge de estrela brilhante', 'badge', 300, 'common', 'bronze', true, '/badges/star.png'),
    (gen_random_uuid(), 'Badge Diamante', 'Badge exclusivo de diamante', 'badge', 2000, 'legendary', 'diamond', true, '/badges/diamond.png'),
    (gen_random_uuid(), 'Animação Sparkle', 'Efeito de brilhos ao redor do avatar', 'animation', 750, 'rare', 'silver', true, null),
    (gen_random_uuid(), 'Animação Fogo', 'Efeito de chamas ao redor do avatar', 'animation', 1500, 'epic', 'gold', true, null)
ON CONFLICT DO NOTHING;
