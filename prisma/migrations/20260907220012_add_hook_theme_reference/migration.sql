-- CreateTable
CREATE TABLE "Hook" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "references" TEXT NOT NULL,
    "elements" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "elements" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceMaterial" (
    "id" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hook_clientId_idx" ON "Hook"("clientId");

-- CreateIndex
CREATE INDEX "Theme_clientId_idx" ON "Theme"("clientId");

-- AddForeignKey
ALTER TABLE "Hook" ADD CONSTRAINT "Hook_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
