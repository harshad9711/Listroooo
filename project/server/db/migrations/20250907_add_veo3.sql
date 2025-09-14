CREATE TABLE IF NOT EXISTS veo_prompts (
  id                TEXT PRIMARY KEY DEFAULT concat('prm_', substr(md5(random()::text),1,16)),
  title             VARCHAR(180),
  idea_hash         TEXT NOT NULL,
  user_id           TEXT,
  provider          TEXT,
  active_version_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS veo_prompt_versions (
  id               TEXT PRIMARY KEY DEFAULT concat('ver_', substr(md5(random()::text),1,16)),
  prompt_id        TEXT NOT NULL REFERENCES veo_prompts(id) ON DELETE CASCADE,
  version          INT  NOT NULL,
  meta             JSONB NOT NULL,
  story            JSONB NOT NULL,
  visuals          JSONB NOT NULL,
  audio            JSONB NOT NULL,
  branding         JSONB NOT NULL,
  deliverables     JSONB NOT NULL,
  provider_job_id  TEXT,
  provider_status  TEXT,
  assets           JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version)
);

CREATE INDEX IF NOT EXISTS idx_veo_prompts_user ON veo_prompts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_idea_user ON veo_prompts(idea_hash, user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_veo_prompts_updated ON veo_prompts;
CREATE TRIGGER trg_veo_prompts_updated BEFORE UPDATE ON veo_prompts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
