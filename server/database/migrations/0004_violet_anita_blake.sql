CREATE TABLE "work_order_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0',
	"organization_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid,
	"category_id" uuid,
	"task_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"time_interval" integer,
	"time_unit" varchar(20),
	"usage_interval_km" numeric(12, 2),
	"usage_interval_hours" numeric(12, 2),
	"last_performed_at" timestamp,
	"last_performed_km" numeric(12, 2),
	"last_performed_hours" numeric(12, 2),
	"next_due_at" timestamp,
	"next_due_km" numeric(12, 2),
	"next_due_hours" numeric(12, 2),
	"lead_time_days" integer DEFAULT 7,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "checklist" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "labor_cost" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "parts_cost" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "total_cost" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "work_order_parts" ADD CONSTRAINT "work_order_parts_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_parts" ADD CONSTRAINT "work_order_parts_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_parts" ADD CONSTRAINT "work_order_parts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_task_id_maintenance_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."maintenance_tasks"("id") ON DELETE no action ON UPDATE no action;