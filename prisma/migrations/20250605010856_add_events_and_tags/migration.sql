-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `game` ENUM('Arma3', 'ArmaReforger') NOT NULL,
    `timeUtc` DATETIME(3) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `longDescription` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `type` ENUM('PvE', 'PvP', 'PvPvE') NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `modSizeMB` INTEGER NOT NULL,
    `modType` ENUM('Vanilla', 'Modded') NOT NULL,
    `serverName` VARCHAR(191) NOT NULL,
    `serverPassword` VARCHAR(191) NULL,
    `serverRegion` ENUM('EU', 'NA', 'Other') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EventToTag` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EventToTag_AB_unique`(`A`, `B`),
    INDEX `_EventToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_EventToTag` ADD CONSTRAINT `_EventToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventToTag` ADD CONSTRAINT `_EventToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
