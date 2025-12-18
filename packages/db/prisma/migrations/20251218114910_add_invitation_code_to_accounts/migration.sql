/*
  Warnings:

  - A unique constraint covering the columns `[invitation_code]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "invitation_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_invitation_code_key" ON "accounts"("invitation_code");
