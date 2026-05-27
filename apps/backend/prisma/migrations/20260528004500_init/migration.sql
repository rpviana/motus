-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "MobilityEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "mobilityType" TEXT,
    "zone" TEXT,
    "command" TEXT,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MobilityEvent_createdAt_idx" ON "MobilityEvent"("createdAt");
