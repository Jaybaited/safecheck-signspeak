BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "parent_students" GROUP BY "studentId" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'A student has more than one parent. Fix the data first.';
  END IF;
END $$;

CREATE TYPE "ArchiveStatus" AS ENUM ('GRADUATED', 'TRANSFERRED_OUT', 'DROPPED_OUT', 'OTHER');

ALTER TABLE "users"
  ADD COLUMN "archivedAt"    TIMESTAMP(3),
  ADD COLUMN "archiveStatus" "ArchiveStatus",
  ADD COLUMN "archiveNote"   TEXT,
  ADD COLUMN "archivedById"  TEXT;

CREATE INDEX "users_archivedAt_idx" ON "users"("archivedAt");

CREATE UNIQUE INDEX "parent_students_studentId_key" ON "parent_students"("studentId");

CREATE TABLE "admin_action_logs" (
  "id"         TEXT NOT NULL,
  "adminId"    TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId"   TEXT,
  "summary"    TEXT NOT NULL,
  "details"    JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "admin_action_logs_adminId_idx" ON "admin_action_logs"("adminId");
CREATE INDEX "admin_action_logs_createdAt_idx" ON "admin_action_logs"("createdAt");
CREATE INDEX "admin_action_logs_targetType_targetId_idx" ON "admin_action_logs"("targetType", "targetId");

COMMIT;