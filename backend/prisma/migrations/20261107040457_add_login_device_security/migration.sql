/*
  Warnings:

  - A unique constraint covering the columns `[customerId,fingerprintHash]` on the table `TrustedDevice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `customer` ADD COLUMN `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lockReason` VARCHAR(191) NULL,
    ADD COLUMN `lockedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `loginrequest` ADD COLUMN `reason` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `trusteddevice` ADD COLUMN `failedAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lockedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `DeviceChangeRequest_customerId_status_idx` ON `DeviceChangeRequest`(`customerId`, `status`);

-- CreateIndex
CREATE INDEX `LoginAttempt_mobileNumber_createdAt_idx` ON `LoginAttempt`(`mobileNumber`, `createdAt`);

-- CreateIndex
CREATE INDEX `LoginAttempt_customerId_createdAt_idx` ON `LoginAttempt`(`customerId`, `createdAt`);

-- CreateIndex
CREATE INDEX `LoginRequest_status_createdAt_idx` ON `LoginRequest`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `LoginRequest_customerId_status_idx` ON `LoginRequest`(`customerId`, `status`);

-- CreateIndex
CREATE INDEX `SecurityLog_eventType_createdAt_idx` ON `SecurityLog`(`eventType`, `createdAt`);

-- CreateIndex
CREATE INDEX `TrustedDevice_customerId_status_idx` ON `TrustedDevice`(`customerId`, `status`);

-- CreateIndex
CREATE UNIQUE INDEX `TrustedDevice_customerId_fingerprintHash_key` ON `TrustedDevice`(`customerId`, `fingerprintHash`);

-- CreateIndex
CREATE INDEX `TwoFactorCode_loginRequestId_expiresAt_idx` ON `TwoFactorCode`(`loginRequestId`, `expiresAt`);
