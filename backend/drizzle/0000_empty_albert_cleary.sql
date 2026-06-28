CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"max_users" integer DEFAULT 100 NOT NULL,
	"max_nas" integer DEFAULT 1 NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"allow_log_access" boolean DEFAULT false NOT NULL,
	"telegram_chat_id" varchar(100),
	"telegram_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "nas" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nasname" varchar(128) NOT NULL,
	"shortname" varchar(32) NOT NULL,
	"type" varchar(30) DEFAULT 'other' NOT NULL,
	"secret" varchar(60) NOT NULL,
	"api_username" varchar(255),
	"api_password_encrypted" varchar(512),
	"description" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radacct" (
	"radacctid" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"acctsessionid" varchar(64) NOT NULL,
	"acctuniqueid" varchar(32) NOT NULL,
	"username" varchar(64) NOT NULL,
	"realm" varchar(64),
	"nasipaddress" varchar(15) NOT NULL,
	"nasportid" varchar(32),
	"nasporttype" varchar(32),
	"acctstarttime" timestamp,
	"acctupdatetime" timestamp,
	"acctstoptime" timestamp,
	"acctinterval" integer,
	"acctsessiontime" integer,
	"acctauthentic" varchar(32),
	"connectinfo_start" varchar(128),
	"connectinfo_stop" varchar(128),
	"acctinputoctets" integer,
	"acctoutputoctets" integer,
	"calledstationid" varchar(50),
	"callingstationid" varchar(50),
	"acctterminatecause" varchar(32),
	"servicetype" varchar(32),
	"framedprotocol" varchar(32),
	"framedipaddress" varchar(15)
);
--> statement-breakpoint
CREATE TABLE "radcheck" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"username" varchar(64) NOT NULL,
	"attribute" varchar(64) NOT NULL,
	"op" varchar(2) DEFAULT '==' NOT NULL,
	"value" varchar(253) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radgroupcheck" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"groupname" varchar(64) NOT NULL,
	"attribute" varchar(64) NOT NULL,
	"op" varchar(2) DEFAULT '==' NOT NULL,
	"value" varchar(253) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radgroupreply" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"groupname" varchar(64) NOT NULL,
	"attribute" varchar(64) NOT NULL,
	"op" varchar(2) DEFAULT '=' NOT NULL,
	"value" varchar(253) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radreply" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"username" varchar(64) NOT NULL,
	"attribute" varchar(64) NOT NULL,
	"op" varchar(2) DEFAULT '=' NOT NULL,
	"value" varchar(253) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radusergroup" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"username" varchar(64) NOT NULL,
	"groupname" varchar(64) NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mac_bypass" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mac_address" varchar(17) NOT NULL,
	"vlan_id" varchar(10),
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voucher_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"prefix" varchar(10),
	"amount" integer NOT NULL,
	"groupname" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(32) NOT NULL,
	"status" varchar DEFAULT 'unused' NOT NULL,
	"used_by_username" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nas" ADD CONSTRAINT "nas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radacct" ADD CONSTRAINT "radacct_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radcheck" ADD CONSTRAINT "radcheck_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radgroupcheck" ADD CONSTRAINT "radgroupcheck_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radgroupreply" ADD CONSTRAINT "radgroupreply_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radreply" ADD CONSTRAINT "radreply_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radusergroup" ADD CONSTRAINT "radusergroup_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mac_bypass" ADD CONSTRAINT "mac_bypass_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_batches" ADD CONSTRAINT "voucher_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_batch_id_voucher_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."voucher_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "radcheck_unique_idx" ON "radcheck" USING btree ("tenant_id","username","attribute");--> statement-breakpoint
CREATE UNIQUE INDEX "radusergroup_unique_idx" ON "radusergroup" USING btree ("tenant_id","username");