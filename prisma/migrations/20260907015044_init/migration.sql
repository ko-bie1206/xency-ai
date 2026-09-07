-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewToken" TEXT NOT NULL,
    "xHandle" TEXT,
    "avatarPath" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "notes" TEXT,
    "output" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextSummary" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "youtube" TEXT,
    "sns" TEXT,
    "other" TEXT,
    "summary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContextSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingSession" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "pendingQuestion" TEXT,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingQA" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HearingQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "imagePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_reviewToken_key" ON "Client"("reviewToken");

-- CreateIndex
CREATE INDEX "Post_clientId_idx" ON "Post"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ContextSummary_clientId_key" ON "ContextSummary"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "HearingSession_clientId_key" ON "HearingSession"("clientId");

-- CreateIndex
CREATE INDEX "HearingQA_sessionId_idx" ON "HearingQA"("sessionId");

-- CreateIndex
CREATE INDEX "ScheduledPost_clientId_scheduledDate_idx" ON "ScheduledPost"("clientId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextSummary" ADD CONSTRAINT "ContextSummary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingSession" ADD CONSTRAINT "HearingSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingQA" ADD CONSTRAINT "HearingQA_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HearingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
