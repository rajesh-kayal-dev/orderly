-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'in_transit';

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "inTransitAt" TIMESTAMP(3),
ADD COLUMN "failedAt" TIMESTAMP(3);