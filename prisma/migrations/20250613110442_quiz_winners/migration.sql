-- CreateTable
CREATE TABLE "QuizWinners" (
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "chatId" TEXT,
    "pollId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 5,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "QuizWinners_pkey" PRIMARY KEY ("id")
);
