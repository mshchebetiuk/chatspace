/*
  Warnings:

  - A unique constraint covering the columns `[privateUser1Id,privateUser2Id]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "privateUser1Id" INTEGER,
ADD COLUMN     "privateUser2Id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_privateUser1Id_privateUser2Id_key" ON "Conversation"("privateUser1Id", "privateUser2Id");
