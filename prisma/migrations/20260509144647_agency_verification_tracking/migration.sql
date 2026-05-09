-- AlterTable
ALTER TABLE "citizen_profiles" ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AddForeignKey
ALTER TABLE "citizen_profiles" ADD CONSTRAINT "citizen_profiles_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "agency_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
