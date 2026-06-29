CREATE TABLE "radpostauth" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"username" varchar(64) NOT NULL,
	"pass" varchar(64),
	"reply" varchar(32),
	"authdate" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"default_profile" varchar(64),
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "radacct" ALTER COLUMN "acctinputoctets" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "radacct" ALTER COLUMN "acctoutputoctets" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "nas" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "radcheck" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "mac_bypass" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "radpostauth" ADD CONSTRAINT "radpostauth_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nas" ADD CONSTRAINT "nas_nasname_unique" UNIQUE("nasname");