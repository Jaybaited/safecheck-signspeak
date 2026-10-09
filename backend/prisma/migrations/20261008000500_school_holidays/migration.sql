BEGIN;
CREATE TABLE "school_holidays" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "school_holidays_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "school_holidays_date_key" ON "school_holidays"("date");
COMMIT;