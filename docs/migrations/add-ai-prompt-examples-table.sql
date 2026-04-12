-- Migration: Add AI Prompt Examples Table
-- Date: 2026-04-12
-- Description: Creates table for managing AI prompt examples shown to customers

-- AI Prompt Examples table
CREATE TABLE ai_prompt_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text VARCHAR(500) NOT NULL, -- The example prompt text
  category VARCHAR(100) DEFAULT 'general', -- Category for organization (general, animals, nature, etc.)
  product_types TEXT[] DEFAULT '{}', -- Array of product types this prompt applies to, empty means all
  display_order INTEGER DEFAULT 0, -- Order for displaying prompts
  is_active BOOLEAN DEFAULT true, -- Whether this prompt is shown to customers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) -- Admin who created it
);

-- Insert default prompt examples
INSERT INTO ai_prompt_examples (prompt_text, category, display_order) VALUES
  ('A golden retriever wearing a party hat', 'animals', 1),
  ('Beautiful sunset over mountains', 'nature', 2),
  ('Colorful geometric abstract pattern', 'abstract', 3),
  ('Vintage coffee shop illustration', 'vintage', 4),
  ('Cute cartoon cat with big eyes', 'animals', 5),
  ('Space scene with planets and stars', 'space', 6),
  ('Hand-drawn floral border design', 'floral', 7),
  ('Retro 80s neon cityscape', 'retro', 8),
  ('Watercolor butterfly on flowers', 'nature', 9),
  ('Minimalist geometric logo design', 'business', 10),
  ('Fantasy dragon in the clouds', 'fantasy', 11),
  ('Beach scene with palm trees', 'nature', 12);

-- Indexes for performance
CREATE INDEX idx_ai_prompt_examples_category ON ai_prompt_examples(category);
CREATE INDEX idx_ai_prompt_examples_active ON ai_prompt_examples(is_active);
CREATE INDEX idx_ai_prompt_examples_display_order ON ai_prompt_examples(display_order);

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_ai_prompt_examples_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_ai_prompt_examples_updated_at
  BEFORE UPDATE ON ai_prompt_examples
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_prompt_examples_updated_at();

-- Comments for documentation
COMMENT ON TABLE ai_prompt_examples IS 'Example prompts shown to customers in the AI generation tool';
COMMENT ON COLUMN ai_prompt_examples.prompt_text IS 'The example prompt text displayed to customers';
COMMENT ON COLUMN ai_prompt_examples.product_types IS 'Array of product types this prompt applies to. Empty array means available for all products';