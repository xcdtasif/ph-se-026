/*
  Warnings:

  - You are about to drop the column `amenities` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `area` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `areaSqft` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `bathrooms` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `properties` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "properties_area_idx";

-- DropIndex
DROP INDEX "properties_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "amenities",
DROP COLUMN "area",
DROP COLUMN "areaSqft",
DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "country",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "mapLocation" TEXT;
