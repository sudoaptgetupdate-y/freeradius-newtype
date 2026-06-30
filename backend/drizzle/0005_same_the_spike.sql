CREATE TABLE "radius_dictionary" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"vendor" varchar(64) NOT NULL,
	"attribute" varchar(64) NOT NULL,
	"recommended_op" varchar(2) DEFAULT '=' NOT NULL,
	"recommended_type" varchar(10) DEFAULT 'reply' NOT NULL,
	"description" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "tenant_portal_settings" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"org_name" varchar(255) NOT NULL,
	"logo_url" varchar(500),
	"terms_of_service" text,
	"footer_note" text,
	"is_register_enabled" boolean DEFAULT true NOT NULL,
	"is_social_login_enabled" boolean DEFAULT true NOT NULL,
	"theme_color" varchar(10) DEFAULT '#0A2540' NOT NULL,
	"welcome_message" text,
	"left_bg_color" varchar(10) DEFAULT '#071D33' NOT NULL,
	"left_text_color" varchar(10) DEFAULT '#FFFFFF' NOT NULL,
	"left_accent_color" varchar(10) DEFAULT '#F59E0B' NOT NULL,
	"google_client_id_override" text,
	"google_client_secret_override" text,
	"line_channel_id_override" text,
	"line_channel_secret_override" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "primary_device_type" varchar DEFAULT 'mikrotik' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "default_register_profile" varchar(255);--> statement-breakpoint
ALTER TABLE "radacct" ADD COLUMN "framedipv6address" varchar(45);--> statement-breakpoint
ALTER TABLE "radacct" ADD COLUMN "framedipv6prefix" varchar(45);--> statement-breakpoint
ALTER TABLE "radacct" ADD COLUMN "framedinterfaceid" varchar(44);--> statement-breakpoint
ALTER TABLE "radacct" ADD COLUMN "delegatedipv6prefix" varchar(45);--> statement-breakpoint
ALTER TABLE "global_settings" ADD COLUMN "google_client_id" text;--> statement-breakpoint
ALTER TABLE "global_settings" ADD COLUMN "google_client_secret" text;--> statement-breakpoint
ALTER TABLE "global_settings" ADD COLUMN "line_channel_id" text;--> statement-breakpoint
ALTER TABLE "global_settings" ADD COLUMN "line_channel_secret" text;--> statement-breakpoint
ALTER TABLE "radius_dictionary" ADD CONSTRAINT "radius_dictionary_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_portal_settings" ADD CONSTRAINT "tenant_portal_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radacct" ADD CONSTRAINT "radacct_acctuniqueid_unique" UNIQUE("acctuniqueid");