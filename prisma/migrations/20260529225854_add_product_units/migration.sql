/*
  Warnings:

  - Added the required column `baseUnit` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductUnitType" AS ENUM ('SACHET', 'BOTOL', 'KARTON', 'PCS', 'RENTENG', 'DUS');

-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('SACHET', 'BOTOL', 'KARTON', 'PCS');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "baseUnit" "BaseUnit" NOT NULL;

-- CreateTable
CREATE TABLE "ProductUnit" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitName" "ProductUnitType" NOT NULL,
    "multiplier" INTEGER NOT NULL,

    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductUnit_productId_unitName_key" ON "ProductUnit"("productId", "unitName");

-- AddForeignKey
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
