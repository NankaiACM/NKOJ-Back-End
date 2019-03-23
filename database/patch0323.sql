begin;

ALTER TABLE problems ALTER COLUMN detail_judge DROP DEFAULT;
ALTER TABLE problems ALTER detail_judge TYPE smallint USING CASE WHEN detail_judge=TRUE THEN 1 ELSE 0 END;
ALTER TABLE problems ALTER COLUMN detail_judge SET DEFAULT 0;

ALTER TABLE solutions ADD COLUMN detail jsonb DEFAULT '{}'::jsonb;
ALTER TABLE solutions ADD COLUMN compile_info text DEFAULT '';

commit;