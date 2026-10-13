-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "coverUrl" TEXT,
    "state" "PublishState" NOT NULL DEFAULT 'DRAFT',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseUnit" (
    "moduleId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("moduleId","unitId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_state_sort_idx" ON "Course"("state", "sort");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_sort_idx" ON "CourseModule"("courseId", "sort");

-- CreateIndex
CREATE INDEX "CourseUnit_unitId_idx" ON "CourseUnit"("unitId");

-- CreateIndex
CREATE INDEX "CourseUnit_moduleId_sort_idx" ON "CourseUnit"("moduleId", "sort");

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseUnit" ADD CONSTRAINT "CourseUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ContentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing lessons become the first published course. Legacy block fields remain
-- available until the student catalogue is switched to the new structure.
INSERT INTO "Course" ("id", "slug", "title", "summary", "state", "sort", "createdAt", "updatedAt")
SELECT
    'legacy-default-course',
    'digital-marketing-department',
    'Цифровой отдел маркетинга',
    'Основная образовательная программа платформы.',
    'PUBLISHED',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "ContentUnit" WHERE "type" = 'LESSON');

INSERT INTO "CourseModule" ("id", "courseId", "title", "sort", "createdAt", "updatedAt")
SELECT
    CASE
        WHEN "block" IS NULL THEN 'legacy-default-module-unassigned'
        ELSE 'legacy-default-module-' || "block"::text
    END,
    'legacy-default-course',
    CASE
        WHEN "block" IS NULL THEN 'Без блока'
        ELSE 'Блок ' || "block"::text
    END,
    COALESCE("block", 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ContentUnit"
WHERE "type" = 'LESSON'
GROUP BY "block";

INSERT INTO "CourseUnit" ("moduleId", "unitId", "sort", "createdAt")
SELECT
    CASE
        WHEN "block" IS NULL THEN 'legacy-default-module-unassigned'
        ELSE 'legacy-default-module-' || "block"::text
    END,
    "id",
    COALESCE("orderInBlock", "sort", 0),
    CURRENT_TIMESTAMP
FROM "ContentUnit"
WHERE "type" = 'LESSON';
