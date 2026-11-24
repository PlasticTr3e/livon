BEGIN;

CREATE TYPE "Role_agency" AS ENUM ('AGENCY', 'WARGA', 'DEVELOPER');

ALTER TABLE "users"
ALTER COLUMN "role" TYPE "Role_agency"
USING (
  CASE WHEN "role"::text = 'ADMIN' THEN 'AGENCY' ELSE "role"::text END
)::"Role_agency";

DROP TYPE "Role";
ALTER TYPE "Role_agency" RENAME TO "Role";

COMMIT;
