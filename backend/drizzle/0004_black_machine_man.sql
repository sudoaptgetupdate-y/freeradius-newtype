ALTER TABLE "radacct" ALTER COLUMN "tenant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "radpostauth" ALTER COLUMN "tenant_id" DROP NOT NULL;