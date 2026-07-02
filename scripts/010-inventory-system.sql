-- =============================================
-- Script 010: Complete Inventory System
-- =============================================

-- 1. Add is_active column to user_purchases for tracking active items
ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- 2. Create a view for user inventory with active status
CREATE OR REPLACE VIEW user_inventory AS
SELECT 
  up.id as purchase_id,
  up.user_id,
  up.item_id,
  up.is_active,
  up.purchased_at,
  si.name,
  si.description,
  si.item_type,
  si.price,
  si.image_url,
  si.rarity,
  si.min_level
FROM user_purchases up
JOIN shop_items si ON up.item_id = si.id;

-- 3. Add more customization columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_border_id UUID REFERENCES shop_items(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_theme_id UUID REFERENCES shop_items(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_badge_id UUID REFERENCES shop_items(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_animation_id UUID REFERENCES shop_items(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_title VARCHAR(100);

-- 4. Add more shop items with preview data
INSERT INTO shop_items (name, description, item_type, price, rarity, min_level, image_url)
SELECT name, description, item_type, price, rarity, min_level, image_url
FROM (VALUES
  -- Borders with CSS gradient data stored in image_url
  ('Borda Esmeralda', 'Verde brilhante com efeito cristal', 'border', 600, 'rare', 'prata', 'linear-gradient(135deg, #10b981, #059669, #10b981)'),
  ('Borda Aurora', 'Efeito aurora boreal animado', 'border', 1200, 'epic', 'ouro', 'linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981, #8b5cf6)'),
  ('Borda Lava', 'Magma incandescente pulsante', 'border', 1800, 'legendary', 'ouro', 'linear-gradient(135deg, #ef4444, #f97316, #eab308, #ef4444)'),
  
  -- Themes with color schemes
  ('Tema Floresta', 'Tons verdes naturais e relaxantes', 'theme', 400, 'common', 'bronze', '#166534,#15803d,#22c55e'),
  ('Tema Noite Estrelada', 'Azul profundo com destaques dourados', 'theme', 600, 'rare', 'prata', '#1e1b4b,#312e81,#fbbf24'),
  ('Tema Rosa Sakura', 'Delicado rosa japonês', 'theme', 600, 'rare', 'prata', '#831843,#be185d,#f9a8d4'),
  
  -- Badges with icons
  ('Badge Top Economizador', 'Para os maiores poupadores', 'badge', 300, 'rare', 'prata', 'trophy'),
  ('Badge Guru Financeiro', 'Mestre das finanças pessoais', 'badge', 500, 'epic', 'ouro', 'graduation-cap'),
  ('Badge Madrugador', 'Sempre registra cedo', 'badge', 150, 'common', 'bronze', 'sunrise'),
  
  -- Animations
  ('Animação Confete', 'Celebração colorida em conquistas', 'animation', 600, 'rare', 'prata', 'confetti'),
  ('Animação Estrelas', 'Estrelas brilhantes ao redor', 'animation', 500, 'common', 'bronze', 'stars'),
  ('Animação Brilho', 'Efeito sparkle elegante', 'animation', 400, 'common', 'bronze', 'sparkle')
) AS items(name, description, item_type, price, rarity, min_level, image_url)
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE shop_items.name = items.name);

-- 5. Create function to ensure only one active item per category
CREATE OR REPLACE FUNCTION activate_item(p_user_id UUID, p_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_item_type VARCHAR(50);
BEGIN
  -- Get the item type
  SELECT item_type INTO v_item_type FROM shop_items WHERE id = p_item_id;
  
  -- Deactivate all items of the same type for this user
  UPDATE user_purchases 
  SET is_active = false 
  WHERE user_id = p_user_id 
    AND item_id IN (SELECT id FROM shop_items WHERE item_type = v_item_type);
  
  -- Activate the selected item
  UPDATE user_purchases 
  SET is_active = true 
  WHERE user_id = p_user_id AND item_id = p_item_id;
  
  -- Update the user's active item reference
  IF v_item_type = 'border' THEN
    UPDATE users SET active_border_id = p_item_id WHERE id = p_user_id;
  ELSIF v_item_type = 'theme' THEN
    UPDATE users SET active_theme_id = p_item_id WHERE id = p_user_id;
  ELSIF v_item_type = 'badge' THEN
    UPDATE users SET active_badge_id = p_item_id WHERE id = p_user_id;
  ELSIF v_item_type = 'animation' THEN
    UPDATE users SET active_animation_id = p_item_id WHERE id = p_user_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to deactivate item
CREATE OR REPLACE FUNCTION deactivate_item(p_user_id UUID, p_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_item_type VARCHAR(50);
BEGIN
  -- Get the item type
  SELECT item_type INTO v_item_type FROM shop_items WHERE id = p_item_id;
  
  -- Deactivate the item
  UPDATE user_purchases 
  SET is_active = false 
  WHERE user_id = p_user_id AND item_id = p_item_id;
  
  -- Clear the user's active item reference
  IF v_item_type = 'border' THEN
    UPDATE users SET active_border_id = NULL WHERE id = p_user_id;
  ELSIF v_item_type = 'theme' THEN
    UPDATE users SET active_theme_id = NULL WHERE id = p_user_id;
  ELSIF v_item_type = 'badge' THEN
    UPDATE users SET active_badge_id = NULL WHERE id = p_user_id;
  ELSIF v_item_type = 'animation' THEN
    UPDATE users SET active_animation_id = NULL WHERE id = p_user_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_purchases_active ON user_purchases(user_id, is_active) WHERE is_active = true;
