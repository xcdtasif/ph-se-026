/*
  Warnings:

  - The values [first_payment,monthly_rent,refund] on the enum `PaymentType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,INACTIVE] on the enum `PropertyStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVED,REJECTED,ACTIVE,COMPLETED] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdById` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `requests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[requestId,type,periodStart]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `monthlyRent` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentType_new" AS ENUM ('FIRST_PAYMENT', 'MONTHLY_RENT', 'REFUND');
ALTER TABLE "payments" ALTER COLUMN "type" TYPE "PaymentType_new" USING ("type"::text::"PaymentType_new");
ALTER TYPE "PaymentType" RENAME TO "PaymentType_old";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE "public"."PaymentType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PropertyStatus_new" AS ENUM ('AVAILABLE', 'RENTED', 'UNAVAILABLE');
ALTER TABLE "public"."properties" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "properties" ALTER COLUMN "status" TYPE "PropertyStatus_new" USING ("status"::text::"PropertyStatus_new");
ALTER TYPE "PropertyStatus" RENAME TO "PropertyStatus_old";
ALTER TYPE "PropertyStatus_new" RENAME TO "PropertyStatus";
DROP TYPE "public"."PropertyStatus_old";
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('MOVE_IN_REQUESTED', 'MOVE_IN_APPROVED', 'MOVE_IN_REJECTED', 'MOVED_IN', 'MOVE_OUT_REQUESTED', 'MOVE_OUT_APPROVED', 'MOVE_OUT_REJECTED', 'MOVED_OUT');
ALTER TABLE "requests" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_createdById_fkey";

-- DropIndex
DROP INDEX "payments_requestId_key";

-- DropIndex
DROP INDEX "properties_isAvailable_idx";

-- DropIndex
DROP INDEX "requests_type_idx";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "createdById";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "isAvailable",
DROP COLUMN "price",
ADD COLUMN     "monthlyRent" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "requests" DROP COLUMN "type",
ALTER COLUMN "status" SET DEFAULT 'MOVE_IN_REQUESTED';

-- CreateIndex
CREATE INDEX "payments_requestId_idx" ON "payments"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_requestId_type_periodStart_key" ON "payments"("requestId", "type", "periodStart");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");
