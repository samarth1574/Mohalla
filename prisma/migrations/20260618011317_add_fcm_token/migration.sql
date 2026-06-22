-- AlterTable
ALTER TABLE "User" ADD COLUMN "fcmToken" TEXT;

-- CreateIndex
CREATE INDEX "User_fcmToken_idx" ON "User"("fcmToken") WHERE "fcmToken" IS NOT NULL;
