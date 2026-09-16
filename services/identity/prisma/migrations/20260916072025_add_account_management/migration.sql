-- AlterEnum
ALTER TYPE "AccountStatus" ADD VALUE 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "statusChangedBy" TEXT;

-- CreateIndex
CREATE INDEX "User_status_role_idx" ON "User"("status", "role");
