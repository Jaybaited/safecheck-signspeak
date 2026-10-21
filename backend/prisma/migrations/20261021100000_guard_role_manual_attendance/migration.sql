ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GUARD';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceMethod') THEN
    RAISE EXCEPTION 'AttendanceMethod already exists - this migration was already applied';
  END IF;
END $$;

BEGIN;
CREATE TYPE "AttendanceMethod" AS ENUM ('CARD', 'MANUAL');
ALTER TABLE "attendances" ADD COLUMN "method" "AttendanceMethod" NOT NULL DEFAULT 'CARD';
ALTER TABLE "attendances" ADD COLUMN "markedById" TEXT;
ALTER TABLE "attendances" ADD COLUMN "markedReason" TEXT;
COMMIT;