-- Tabela para armazenar histórico de mensagens do copilot
CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  action VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_copilot_messages_user_id ON copilot_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_created_at ON copilot_messages(created_at DESC);
