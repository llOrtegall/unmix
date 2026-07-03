CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "stems" (
	"track_id" uuid NOT NULL,
	"name" text NOT NULL,
	"object_key" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"silent" boolean NOT NULL,
	CONSTRAINT "stems_track_id_name_pk" PRIMARY KEY("track_id","name")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"original_filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"input_key" text NOT NULL,
	"status" text NOT NULL,
	"duration_seconds" double precision,
	"latest_job_id" uuid,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "separation_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"track_id" uuid NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"stage" text,
	"progress" integer DEFAULT 0 NOT NULL,
	"failure" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "stems" ADD CONSTRAINT "stems_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracks_created_at_idx" ON "tracks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "separation_jobs_status_idx" ON "separation_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "separation_jobs_track_idx" ON "separation_jobs" USING btree ("track_id");