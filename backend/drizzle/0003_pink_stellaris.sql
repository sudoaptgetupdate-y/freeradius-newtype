ALTER TABLE "voucher_batches" ADD COLUMN "type" varchar DEFAULT 'code' NOT NULL;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "password" varchar(32);