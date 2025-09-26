-- Création de la table academy_questions
CREATE TABLE IF NOT EXISTS academy_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES academy_modules(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('qcm', 'open_question', 'rp_scenario', 'image_analysis', 'audio_video')),
  points INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  media_url TEXT,
  correct_answer TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table academy_qcm_options
CREATE TABLE IF NOT EXISTS academy_qcm_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES academy_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  option_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_academy_questions_module_id ON academy_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_qcm_options_question_id ON academy_qcm_options(question_id);