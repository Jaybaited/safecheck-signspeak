BEGIN;
ALTER TABLE "attendances" ADD COLUMN "noTapOut" BOOLEAN NOT NULL DEFAULT false;
UPDATE "attendances"
SET "noTapOut" = true,
    "status" = CASE
      WHEN (("timeIn" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Manila')::time >= time '08:01:00'
        THEN 'LATE'::"AttendanceStatus"
      ELSE 'PRESENT'::"AttendanceStatus"
    END
WHERE "status" = 'UNCONFIRMED_OUT' AND "timeIn" IS NOT NULL;
COMMIT;