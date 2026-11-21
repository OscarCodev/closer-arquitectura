-- AlterTable
ALTER TABLE "practice_sessions" ADD COLUMN     "name_is_auto" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "simulations" ADD COLUMN     "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
