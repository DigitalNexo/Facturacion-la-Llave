-- CreateTable
CREATE TABLE "usage_counters" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "tenants_count" INTEGER NOT NULL DEFAULT 0,
    "users_count" INTEGER NOT NULL DEFAULT 0,
    "invoices_count" INTEGER NOT NULL DEFAULT 0,
    "storage_mb" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_counters_account_id_idx" ON "usage_counters"("account_id");

-- CreateIndex
CREATE INDEX "usage_counters_period_idx" ON "usage_counters"("period");

-- CreateIndex
CREATE UNIQUE INDEX "usage_counters_account_id_period_key" ON "usage_counters"("account_id", "period");

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
