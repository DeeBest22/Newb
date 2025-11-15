-- CreateTable
CREATE TABLE "PollVotes" (
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "chatId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PollVotes_pkey" PRIMARY KEY ("id")
);
