ALTER TABLE "Task" ADD COLUMN "googleEventId" TEXT;

CREATE UNIQUE INDEX "Task_googleEventId_key" ON "Task"("googleEventId");