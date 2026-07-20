-- DropForeignKey
ALTER TABLE "Affiliate" DROP CONSTRAINT "Affiliate_userId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateClick" DROP CONSTRAINT "AffiliateClick_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateSale" DROP CONSTRAINT "AffiliateSale_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateSale" DROP CONSTRAINT "AffiliateSale_orderId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateWithdrawal" DROP CONSTRAINT "AffiliateWithdrawal_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateWithdrawal" DROP CONSTRAINT "AffiliateWithdrawal_userId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_variantId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseKey" DROP CONSTRAINT "LicenseKey_orderId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseKey" DROP CONSTRAINT "LicenseKey_variantId_fkey";

-- DropForeignKey
ALTER TABLE "MailAttachment" DROP CONSTRAINT "MailAttachment_mailId_fkey";

-- DropForeignKey
ALTER TABLE "Mailbox" DROP CONSTRAINT "Mailbox_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewReply" DROP CONSTRAINT "ReviewReply_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewReply" DROP CONSTRAINT "ReviewReply_userId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropIndex
DROP INDEX "Affiliate_trackingCode_idx";

-- DropIndex
DROP INDEX "Affiliate_trackingCode_key";

-- DropIndex
DROP INDEX "Affiliate_userId_key";

-- DropIndex
DROP INDEX "AffiliateSale_orderId_key";

-- DropIndex
DROP INDEX "AuditLog_timestamp_idx";

-- DropIndex
DROP INDEX "Inventory_variantId_key";

-- DropIndex
DROP INDEX "LicenseKey_variantId_status_idx";

-- DropIndex
DROP INDEX "Mailbox_userId_read_idx";

-- DropIndex
DROP INDEX "Order_userId_idx";

-- DropIndex
DROP INDEX "OrderItem_orderId_idx";

-- DropIndex
DROP INDEX "Permission_action_key";

-- DropIndex
DROP INDEX "Product_komerzaProductId_key";

-- DropIndex
DROP INDEX "Product_name_key";

-- DropIndex
DROP INDEX "ProductVariant_komerzaVariantId_key";

-- DropIndex
DROP INDEX "ProductVariant_productId_idx";

-- DropIndex
DROP INDEX "Review_userId_idx";

-- DropIndex
DROP INDEX "ReviewReply_reviewId_key";

-- DropIndex
DROP INDEX "User_discordId_idx";

-- DropIndex
DROP INDEX "User_discordId_key";

-- DropIndex
DROP INDEX "User_email_username_idx";

-- AlterTable
ALTER TABLE "Affiliate" DROP COLUMN "allTimeEarned",
DROP COLUMN "balance",
DROP COLUMN "isEnabled",
DROP COLUMN "percentageOff",
DROP COLUMN "returnPercentage",
DROP COLUMN "trackingCode",
ADD COLUMN     "code" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AffiliateClick" DROP COLUMN "ipAddress",
ADD COLUMN     "ip" TEXT;

-- AlterTable
ALTER TABLE "AffiliateSale" ALTER COLUMN "orderId" DROP NOT NULL,
ALTER COLUMN "commission" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "AffiliateWithdrawal" DROP COLUMN "address",
DROP COLUMN "currency",
DROP COLUMN "processedAt",
DROP COLUMN "userId",
DROP COLUMN "voidReason",
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "label",
DROP COLUMN "text",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "actor",
DROP COLUMN "discordId",
DROP COLUMN "newValue",
DROP COLUMN "prevValue",
DROP COLUMN "timestamp",
DROP COLUMN "userId",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "actorType" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "createdAt",
DROP COLUMN "isEnabled",
DROP COLUMN "percentageDecrease",
ADD COLUMN     "discountPct" INTEGER NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "uses" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "maxStock",
DROP COLUMN "variantId",
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "reserved" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LicenseKey" DROP COLUMN "assignedAt",
DROP COLUMN "createdAt",
DROP COLUMN "keyPayload",
DROP COLUMN "status",
DROP COLUMN "variantId",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "reserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reservedAt" TIMESTAMP(3),
ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MailAttachment" DROP COLUMN "fileName",
DROP COLUMN "fileUrl",
DROP COLUMN "mailId",
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "mailboxId" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Mailbox" DROP COLUMN "message",
DROP COLUMN "read",
DROP COLUMN "sender",
DROP COLUMN "userId",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "amountPaid",
DROP COLUMN "couponCode",
DROP COLUMN "customerEmail",
DROP COLUMN "gateway",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "receipt" JSONB,
ADD COLUMN     "total" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "komerzaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "sku" TEXT,
ALTER COLUMN "variantId" DROP NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "isVip",
DROP COLUMN "link",
DROP COLUMN "logo",
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "action",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "bestSeller",
DROP COLUMN "category",
DROP COLUMN "hidden",
DROP COLUMN "komerzaProductId",
DROP COLUMN "sale",
ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "createdAt",
DROP COLUMN "komerzaVariantId",
DROP COLUMN "updatedAt",
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "comment",
DROP COLUMN "dateSubmitted",
ADD COLUMN     "body" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "productId" TEXT NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "verified" SET DEFAULT false;

-- AlterTable
ALTER TABLE "ReviewReply" DROP COLUMN "replyText",
ADD COLUMN     "body" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "inheritance",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "ipAddress",
DROP COLUMN "isRevoked",
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- Preserve existing user role assignments before dropping User.roleId
INSERT INTO "UserRole" ("id", "userId", "roleId")
SELECT gen_random_uuid()::text, "id", "roleId" FROM "User" WHERE "roleId" IS NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "resetExpires" TIMESTAMP(3),
ADD COLUMN     "resetToken" TEXT,
DROP COLUMN "avatarUrl",
DROP COLUMN "checkoutEmail",
DROP COLUMN "discordId",
DROP COLUMN "discordTag",
DROP COLUMN "lastLogin",
DROP COLUMN "roleId",
DROP COLUMN "sessionVersion",
DROP COLUMN "status";

UPDATE "User" SET "password" = COALESCE("passwordHash", '');
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "passwordHash";
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WebhookEvent" DROP CONSTRAINT "WebhookEvent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "source" SET NOT NULL,
ALTER COLUMN "processedAt" SET NOT NULL,
ALTER COLUMN "processedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Receipt";

-- DropTable
DROP TABLE "SystemSettings";

-- CreateTable
CREATE TABLE "Statistic" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseKey_key_key" ON "LicenseKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseKey" ADD CONSTRAINT "LicenseKey_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAttachment" ADD CONSTRAINT "MailAttachment_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateSale" ADD CONSTRAINT "AffiliateSale_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateSale" ADD CONSTRAINT "AffiliateSale_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateWithdrawal" ADD CONSTRAINT "AffiliateWithdrawal_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

