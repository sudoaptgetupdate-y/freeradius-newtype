CREATE TABLE "voucher_settings" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"default_prefix" varchar(10),
	"logo_url" varchar(500),
	"header_text" varchar(100),
	"ssid_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_token" text,
	"telegram_bot_id" text,
	"telegram_chat_id" text,
	"telegram_enabled" boolean DEFAULT false,
	"redis_host" text,
	"redis_port" integer,
	"redis_password" text,
	"loki_url" text,
	"vector_port" integer,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_user" text,
	"smtp_password" text,
	"smtp_sender" text,
	"timezone" text DEFAULT 'Asia/Bangkok',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "voucher_settings" ADD CONSTRAINT "voucher_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;