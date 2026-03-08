/*
  Warnings:

  - You are about to drop the column `villageId` on the `CitizenProfile` table. All the data in the column will be lost.
  - You are about to drop the column `villageId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `Village` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `address` to the `CitizenProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CitizenProfile" DROP CONSTRAINT "CitizenProfile_villageId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_villageId_fkey";

-- AlterTable
ALTER TABLE "CitizenProfile" DROP COLUMN "villageId",
ADD COLUMN     "address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "villageId";

-- DropTable
DROP TABLE "Village";
