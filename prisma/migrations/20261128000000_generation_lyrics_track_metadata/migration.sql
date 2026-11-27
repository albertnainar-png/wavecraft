ALTER TABLE "Generation"
  ADD COLUMN "lyrics" TEXT,
  ADD COLUMN "vocalLanguage" TEXT NOT NULL DEFAULT 'en';

ALTER TABLE "Track"
  ADD COLUMN "bpm" INTEGER,
  ADD COLUMN "keyScale" TEXT;

ALTER TABLE "Track" ADD COLUMN "lyrics" TEXT;

ALTER TABLE "Track" ADD COLUMN "providerAudioPath" TEXT;
