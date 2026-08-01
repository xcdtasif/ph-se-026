/*
  Warnings:

  - You are about to drop the column `city` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `properties` table. All the data in the column will be lost.
  - Made the column `address` on table `properties` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "properties_city_state_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "city",
DROP COLUMN "location",
DROP COLUMN "state",
DROP COLUMN "zipCode",
ADD COLUMN     "area" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ALTER COLUMN "address" SET NOT NULL;

-- CreateIndex
CREATE INDEX "properties_area_idx" ON "properties"("area");

-- CreateIndex
CREATE INDEX "properties_latitude_longitude_idx" ON "properties"("latitude", "longitude");
