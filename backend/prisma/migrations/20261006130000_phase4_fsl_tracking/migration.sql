-- CreateEnum
CREATE TYPE "FSLActivitySource" AS ENUM ('PRACTICE', 'GAME');

-- CreateTable
CREATE TABLE "fsl_activity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "source" "FSLActivitySource" NOT NULL DEFAULT 'PRACTICE',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fsl_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fsl_game_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "lettersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fsl_game_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fsl_activity_studentId_createdAt_idx" ON "fsl_activity"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "fsl_game_scores_studentId_mode_idx" ON "fsl_game_scores"("studentId", "mode");

-- AddForeignKey
ALTER TABLE "fsl_activity" ADD CONSTRAINT "fsl_activity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsl_activity" ADD CONSTRAINT "fsl_activity_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "fsl_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fsl_game_scores" ADD CONSTRAINT "fsl_game_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
