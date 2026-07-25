-- ADR 0031: worker failure codes moved to `separation.*`.
UPDATE "separation_jobs"
SET "failure" = jsonb_set("failure", '{code}', to_jsonb((CASE "failure"->>'code'
  WHEN 'INVALID_MESSAGE' THEN 'separation.invalid_message'
  WHEN 'INPUT_NOT_FOUND' THEN 'separation.input_not_found'
  WHEN 'INVALID_MEDIA' THEN 'separation.invalid_media'
  WHEN 'DURATION_EXCEEDED' THEN 'separation.duration_exceeded'
  ELSE 'separation.failed'
END)::text))
WHERE "failure" IS NOT NULL AND "failure"->>'code' NOT LIKE 'separation.%';
--> statement-breakpoint
UPDATE "outbox"
SET "payload" = jsonb_set("payload", '{code}', to_jsonb((CASE "payload"->>'code'
  WHEN 'INVALID_MESSAGE' THEN 'separation.invalid_message'
  WHEN 'INPUT_NOT_FOUND' THEN 'separation.input_not_found'
  WHEN 'INVALID_MEDIA' THEN 'separation.invalid_media'
  WHEN 'DURATION_EXCEEDED' THEN 'separation.duration_exceeded'
  ELSE 'separation.failed'
END)::text))
WHERE "event_type" = 'separation.failed' AND "payload"->>'code' NOT LIKE 'separation.%';
