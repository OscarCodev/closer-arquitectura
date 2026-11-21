-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('IN_CALL', 'EVALUATING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_profiles" (
    "user_id" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "prospect_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "person_name" VARCHAR(120),
    "role_company" VARCHAR(200),
    "prospect" VARCHAR(1400) NOT NULL,
    "context" VARCHAR(1400) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "voice_name" VARCHAR(40),
    "prospect" VARCHAR(1400) NOT NULL,
    "context" VARCHAR(1400) NOT NULL,
    "prospect_name" VARCHAR(120),
    "prospect_role" VARCHAR(120),
    "prospect_company" VARCHAR(120),
    "advanced_selections" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'IN_CALL',
    "score" INTEGER,
    "duration_seconds" INTEGER,
    "metrics" JSONB,
    "conversation" JSONB,
    "analysis" JSONB,
    "transcript" TEXT,
    "failure_reason" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluated_at" TIMESTAMP(3),

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_contacts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" VARCHAR(5000) NOT NULL,
    "page_path" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prospect_profiles_user_id_updated_at_idx" ON "prospect_profiles"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_updated_at_idx" ON "practice_sessions"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "simulations_session_id_created_at_idx" ON "simulations"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "simulations_user_id_created_at_idx" ON "simulations"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "support_contacts_user_id_created_at_idx" ON "support_contacts"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_profiles" ADD CONSTRAINT "prospect_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "practice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_contacts" ADD CONSTRAINT "support_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
