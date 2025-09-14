-- Run ONLY if you are sure no other features use these tables.
-- This will drop Veo3 tables but leaves your other data untouched.

BEGIN;

-- Drop trigger only on veo_prompts (leave any generic functions intact)
DROP TRIGGER IF EXISTS trg_veo_prompts_updated ON veo_prompts;

-- Drop Veo3 tables
DROP TABLE IF EXISTS veo_prompt_versions;
DROP TABLE IF EXISTS veo_prompts;

COMMIT;
