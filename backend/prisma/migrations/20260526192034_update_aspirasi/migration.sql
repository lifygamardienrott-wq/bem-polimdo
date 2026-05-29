/*
  Warnings:

  - You are about to drop the column `status` on the `aspirasi` table. All the data in the column will be lost.
  - Added the required column `kategori` to the `Aspirasi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prioritas` to the `Aspirasi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `aspirasi` DROP COLUMN `status`,
    ADD COLUMN `kategori` VARCHAR(191) NOT NULL,
    ADD COLUMN `prioritas` VARCHAR(191) NOT NULL;
