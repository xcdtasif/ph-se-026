/*
  Warnings:

  - You are about to drop the column `address` on the `properties` table. All the data in the column will be lost.
  - Added the required column `location` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "properties" DROP COLUMN "address",
ADD COLUMN     "location" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "properties_location_idx" ON "properties"("location");
