/*
  Warnings:

  - The values [FIRST_PAYMENT,REFUND] on the enum `PaymentType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentType_new" AS ENUM ('SECURITY_DEPOSIT', 'MONTHLY_RENT', 'MOVE_OUT_REFUND');
ALTER TABLE "payments" ALTER COLUMN "type" TYPE "PaymentType_new" USING ("type"::text::"PaymentType_new");
ALTER TYPE "PaymentType" RENAME TO "PaymentType_old";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE "public"."PaymentType_old";
COMMIT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BDT';

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "averageRating" DOUBLE PRECISION;

-- DropEnum
DROP TYPE "RequestType";

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");
