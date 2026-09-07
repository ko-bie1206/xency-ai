-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadItem" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "referenceText" TEXT,
    "referenceImagePath" TEXT,
    "instruction" TEXT,
    "output" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreadItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Thread_clientId_key" ON "Thread"("clientId");

-- CreateIndex
CREATE INDEX "ThreadItem_threadId_idx" ON "ThreadItem"("threadId");

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadItem" ADD CONSTRAINT "ThreadItem_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
