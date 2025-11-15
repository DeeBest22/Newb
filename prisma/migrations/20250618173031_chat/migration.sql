-- CreateTable
CREATE TABLE "Chat" (
    "chatId" TEXT,
    "chatType" TEXT,
    "title" TEXT,
    "username" TEXT,
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);
