-- Card status for student RFID cards, and a table of retired (lost or replaced) cards.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RfidCardStatus') THEN
    RAISE EXCEPTION 'RfidCardStatus already exists - this migration was already applied';
  END IF;
END $$;

BEGIN;
CREATE TYPE "RfidCardStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LOST');
CREATE TYPE "RetiredCardReason" AS ENUM ('LOST', 'REPLACED');
ALTER TABLE "users" ADD COLUMN "rfidCardStatus" "RfidCardStatus" NOT NULL DEFAULT 'ACTIVE';
CREATE TABLE "retired_cards" (
  "id" TEXT NOT NULL,
  "cardNumber" TEXT NOT NULL,
  "reason" "RetiredCardReason" NOT NULL,
  "studentId" TEXT,
  "studentName" TEXT,
  "note" TEXT,
  "retiredById" TEXT,
  "retiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "retired_cards_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "retired_cards_cardNumber_key" ON "retired_cards"("cardNumber");
CREATE INDEX "retired_cards_retiredAt_idx" ON "retired_cards"("retiredAt");
COMMIT;