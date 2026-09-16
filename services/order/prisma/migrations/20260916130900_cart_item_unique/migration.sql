-- AlterTable
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_menuItemId_key" UNIQUE ("cartId", "menuItemId");