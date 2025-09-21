/*
  Warnings:

  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `timeUtc` on the `Event` table. All the data in the column will be lost.
  - Added the required column `serverMap` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTimeUtc` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Event` DROP COLUMN `location`,
    DROP COLUMN `timeUtc`,
    ADD COLUMN `serverMap` VARCHAR(191) NOT NULL,
    ADD COLUMN `startTimeUtc` DATETIME(3) NOT NULL;
