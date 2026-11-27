CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "credits" INTEGER NOT NULL DEFAULT 10,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Generation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "styleTags" TEXT[] NOT NULL,
  "instrumental" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "providerJobId" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Track" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "generationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "audioUrl" TEXT,
  "coverUrl" TEXT,
  "durationSecs" INTEGER,
  "tagKey" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "plays" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Generation_userId_status_idx" ON "Generation"("userId", "status");
CREATE INDEX "Track_userId_idx" ON "Track"("userId");
CREATE INDEX "Track_isPublic_idx" ON "Track"("isPublic");

ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Track" ADD CONSTRAINT "Track_generationId_fkey"
  FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
