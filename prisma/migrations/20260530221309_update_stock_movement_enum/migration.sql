/*
  Warnings:

  - The values [PRODUCTION] on the enum `StockMovementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockMovementType_new" AS ENUM ('INBOUND', 'SHIPMENT_OUT', 'SHIPMENT_IN', 'PRODUCTION_CONSUME', 'PRODUCTION_RESULT', 'DISTRIBUTION');
ALTER TABLE "StockMovement" ALTER COLUMN "type" TYPE "StockMovementType_new" USING ("type"::text::"StockMovementType_new");
ALTER TYPE "StockMovementType" RENAME TO "StockMovementType_old";
ALTER TYPE "StockMovementType_new" RENAME TO "StockMovementType";
DROP TYPE "StockMovementType_old";
COMMIT;
