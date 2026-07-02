-- Social Gamification System
-- Levels, Badges, Social Profiles, Tips and Interactions

-- User levels/tiers table
CREATE TABLE IF NOT EXISTS user_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    icon VARCHAR(50),
    color VARCHAR(50),
    gradient_from VARCHAR(50),
    gradient_to VARCHAR(50),
    benefits JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unlockable themes per level
CREATE TABLE IF NOT EXISTS level_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id UUID NOT NULL REFERENCES user_levels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    preview_colors JSONB NOT NULL,
    css_variables JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User unlocked themes
CREATE TABLE IF NOT EXISTS user_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES level_themes(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    UNIQUE(user_id, theme_id)
);

-- User profile settings (public/private)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    bio TEXT,
    is_public BOOLEAN DEFAULT true,
    show_level BOOLEAN DEFAULT true,
    show_badges BOOLEAN DEFAULT true,
    show_streaks BOOLEAN DEFAULT true,
    show_challenges BOOLEAN DEFAULT true,
    allow_comments BOOLEAN DEFAULT true,
    allow_tips_requests BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Social feed - achievements and milestones shared publicly
CREATE TABLE IF NOT EXISTS social_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feed_type VARCHAR(50) NOT NULL, -- 'achievement', 'level_up', 'challenge_complete', 'streak', 'tip'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Likes on social feed
CREATE TABLE IF NOT EXISTS social_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feed_id UUID NOT NULL REFERENCES social_feed(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, feed_id)
);

-- Comments on social feed
CREATE TABLE IF NOT EXISTS social_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feed_id UUID NOT NULL REFERENCES social_feed(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tips/questions from users
CREATE TABLE IF NOT EXISTS tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50), -- 'alimentacao', 'transporte', 'lazer', 'moradia', 'economia_geral'
    is_answered BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Responses to tips
CREATE TABLE IF NOT EXISTS tip_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tip_id UUID NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_helpful BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helpful votes on tip responses
CREATE TABLE IF NOT EXISTS tip_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_id UUID NOT NULL REFERENCES tip_responses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, response_id)
);

-- Profile visits (for analytics, not shown to users)
CREATE TABLE IF NOT EXISTS profile_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add level and theme columns to users if not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level_id UUID REFERENCES user_levels(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_theme_id UUID REFERENCES level_themes(id);

-- Seed user levels
INSERT INTO user_levels (name, slug, min_points, max_points, icon, color, gradient_from, gradient_to, benefits) VALUES
('Bronze', 'bronze', 0, 499, 'medal', '#CD7F32', '#CD7F32', '#8B4513', '["Acesso ao tema Bronze", "Badge de Bronze no perfil"]'),
('Prata', 'prata', 500, 1499, 'medal', '#C0C0C0', '#C0C0C0', '#808080', '["Temas exclusivos Prata", "Badge de Prata", "Graficos extras no dashboard"]'),
('Ouro', 'ouro', 1500, 3999, 'crown', '#FFD700', '#FFD700', '#FFA500', '["Temas premium Ouro", "Badge dourado animado", "Simulacoes ilimitadas", "Destaque no perfil"]'),
('Diamante', 'diamante', 4000, NULL, 'gem', '#B9F2FF', '#E0FFFF', '#00CED1', '["Todos os temas exclusivos", "Badge diamante com brilho", "Bordas especiais", "Acesso antecipado a novidades"]')
ON CONFLICT (slug) DO NOTHING;

-- Seed default themes for each level
INSERT INTO level_themes (level_id, name, slug, preview_colors, css_variables, is_default) VALUES
((SELECT id FROM user_levels WHERE slug = 'bronze'), 'Bronze Classic', 'bronze-classic', 
 '{"primary": "#CD7F32", "accent": "#8B4513"}',
 '{"--primary": "#CD7F32", "--accent": "#8B4513"}', true),
((SELECT id FROM user_levels WHERE slug = 'prata'), 'Prata Elegante', 'prata-elegante',
 '{"primary": "#C0C0C0", "accent": "#708090"}',
 '{"--primary": "#C0C0C0", "--accent": "#708090"}', true),
((SELECT id FROM user_levels WHERE slug = 'prata'), 'Prata Azul', 'prata-azul',
 '{"primary": "#B0C4DE", "accent": "#4682B4"}',
 '{"--primary": "#B0C4DE", "--accent": "#4682B4"}', false),
((SELECT id FROM user_levels WHERE slug = 'ouro'), 'Ouro Imperial', 'ouro-imperial',
 '{"primary": "#FFD700", "accent": "#DAA520"}',
 '{"--primary": "#FFD700", "--accent": "#DAA520"}', true),
((SELECT id FROM user_levels WHERE slug = 'ouro'), 'Ouro Rose', 'ouro-rose',
 '{"primary": "#E6BE8A", "accent": "#CD853F"}',
 '{"--primary": "#E6BE8A", "--accent": "#CD853F"}', false),
((SELECT id FROM user_levels WHERE slug = 'diamante'), 'Diamante Cristal', 'diamante-cristal',
 '{"primary": "#B9F2FF", "accent": "#00CED1"}',
 '{"--primary": "#B9F2FF", "--accent": "#00CED1"}', true),
((SELECT id FROM user_levels WHERE slug = 'diamante'), 'Diamante Aurora', 'diamante-aurora',
 '{"primary": "#E6E6FA", "accent": "#9370DB"}',
 '{"--primary": "#E6E6FA", "--accent": "#9370DB"}', false),
((SELECT id FROM user_levels WHERE slug = 'diamante'), 'Diamante Midnight', 'diamante-midnight',
 '{"primary": "#191970", "accent": "#4169E1"}',
 '{"--primary": "#191970", "--accent": "#4169E1"}', false)
ON CONFLICT (slug) DO NOTHING;

-- Add more achievements for social features
INSERT INTO achievements (name, description, icon, points, achievement_type, requirement_value) VALUES
('Influenciador', 'Recebeu 50 curtidas nas suas conquistas', 'heart', 200, 'social', 50),
('Mentor', 'Ajudou 10 pessoas com dicas uteis', 'users', 300, 'social', 10),
('Estrela Social', 'Seu perfil foi visitado 100 vezes', 'star', 150, 'social', 100),
('Nivel Prata', 'Alcancou o nivel Prata', 'medal', 100, 'level', 2),
('Nivel Ouro', 'Alcancou o nivel Ouro', 'crown', 200, 'level', 3),
('Nivel Diamante', 'Alcancou o nivel Diamante', 'gem', 500, 'level', 4)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_feed_user_id ON social_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_created_at ON social_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_likes_feed_id ON social_likes(feed_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_feed_id ON social_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_tips_category ON tips(category);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tip_responses_tip_id ON tip_responses(tip_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
