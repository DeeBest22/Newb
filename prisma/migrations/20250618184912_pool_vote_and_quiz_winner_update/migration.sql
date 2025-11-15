-- AlterTable
ALTER TABLE "PollVotes" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "QuizWinners" ALTER COLUMN "points" SET DEFAULT 20;
