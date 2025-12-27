ALTER TABLE "custom_forms" ADD COLUMN "form_group_id" uuid;--> statement-breakpoint
ALTER TABLE "custom_forms" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;