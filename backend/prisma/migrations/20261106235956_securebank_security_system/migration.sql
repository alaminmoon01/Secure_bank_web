/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nid]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `account` ADD COLUMN `createdByAdminId` INTEGER NULL;

-- AlterTable
ALTER TABLE `admin` ADD COLUMN `pinHash` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `firstName` VARCHAR(191) NULL,
    ADD COLUMN `isRegistered` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastName` VARCHAR(191) NULL,
    ADD COLUMN `nid` VARCHAR(191) NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `recipientAccount` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TrustedDevice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `deviceName` VARCHAR(191) NULL,
    `fingerprintHash` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `operatingSystem` VARCHAR(191) NULL,
    `approximateLocation` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `deviceId` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedByAdminId` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NULL,
    `mobileNumber` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `fingerprintHash` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TwoFactorCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `loginRequestId` INTEGER NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NULL,
    `adminId` INTEGER NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `description` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedByAdminId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceChangeRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `oldDeviceId` INTEGER NULL,
    `newDeviceId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reason` VARCHAR(191) NULL,
    `reviewedByAdminId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Admin_username_key` ON `Admin`(`username`);

-- CreateIndex
CREATE UNIQUE INDEX `Customer_nid_key` ON `Customer`(`nid`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrustedDevice` ADD CONSTRAINT `TrustedDevice_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginRequest` ADD CONSTRAINT `LoginRequest_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginRequest` ADD CONSTRAINT `LoginRequest_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `TrustedDevice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginRequest` ADD CONSTRAINT `LoginRequest_reviewedByAdminId_fkey` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginAttempt` ADD CONSTRAINT `LoginAttempt_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TwoFactorCode` ADD CONSTRAINT `TwoFactorCode_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TwoFactorCode` ADD CONSTRAINT `TwoFactorCode_loginRequestId_fkey` FOREIGN KEY (`loginRequestId`) REFERENCES `LoginRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportRequest` ADD CONSTRAINT `SupportRequest_reviewedByAdminId_fkey` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportRequest` ADD CONSTRAINT `SupportRequest_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceChangeRequest` ADD CONSTRAINT `DeviceChangeRequest_reviewedByAdminId_fkey` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceChangeRequest` ADD CONSTRAINT `DeviceChangeRequest_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceChangeRequest` ADD CONSTRAINT `DeviceChangeRequest_oldDeviceId_fkey` FOREIGN KEY (`oldDeviceId`) REFERENCES `TrustedDevice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceChangeRequest` ADD CONSTRAINT `DeviceChangeRequest_newDeviceId_fkey` FOREIGN KEY (`newDeviceId`) REFERENCES `TrustedDevice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
