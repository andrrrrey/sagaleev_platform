-- Visibility controls inside published courses.
ALTER TABLE "CourseModule" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CourseUnit" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- Lightweight student requests for work by platform contractors.
CREATE TYPE "ContractorRequestStatus" AS ENUM (
  'NEW',
  'IN_REVIEW',
  'CONTACTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED'
);

CREATE TABLE "ContractorRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ContractorRequestStatus" NOT NULL DEFAULT 'NEW',
  "adminNote" TEXT,
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContractorRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContractorRequest_userId_createdAt_idx" ON "ContractorRequest"("userId", "createdAt");
CREATE INDEX "ContractorRequest_status_createdAt_idx" ON "ContractorRequest"("status", "createdAt");

ALTER TABLE "ContractorRequest"
  ADD CONSTRAINT "ContractorRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
