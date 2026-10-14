-- Lessons can be placed either in a course module or in a route day.
UPDATE "ContentUnit" AS unit
SET "routeDayId" = NULL
WHERE "routeDayId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "RouteDay" AS day WHERE day."id" = unit."routeDayId"
  );

CREATE INDEX "ContentUnit_routeDayId_idx" ON "ContentUnit"("routeDayId");

ALTER TABLE "ContentUnit"
ADD CONSTRAINT "ContentUnit_routeDayId_fkey"
FOREIGN KEY ("routeDayId") REFERENCES "RouteDay"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
