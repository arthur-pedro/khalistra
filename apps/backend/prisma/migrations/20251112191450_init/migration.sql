-- CreateEnum
CREATE TYPE "SnapshotKind" AS ENUM ('INIT', 'RUNTIME');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "lightPlayerId" TEXT NOT NULL,
    "shadowPlayerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting',
    "activePlayerId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL DEFAULT 1,
    "winnerId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoveRecord" (
    "id" SERIAL NOT NULL,
    "matchId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSnapshot" (
    "id" SERIAL NOT NULL,
    "matchId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "kind" "SnapshotKind" NOT NULL DEFAULT 'RUNTIME',
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_alias_key" ON "Player"("alias");

-- CreateIndex
CREATE INDEX "Match_lightPlayerId_idx" ON "Match"("lightPlayerId");

-- CreateIndex
CREATE INDEX "Match_shadowPlayerId_idx" ON "Match"("shadowPlayerId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "MoveRecord_matchId_idx" ON "MoveRecord"("matchId");

-- CreateIndex
CREATE INDEX "MoveRecord_matchId_turn_idx" ON "MoveRecord"("matchId", "turn");

-- CreateIndex
CREATE INDEX "MatchSnapshot_matchId_idx" ON "MatchSnapshot"("matchId");

-- CreateIndex
CREATE INDEX "MatchSnapshot_matchId_turn_idx" ON "MatchSnapshot"("matchId", "turn");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_lightPlayerId_fkey" FOREIGN KEY ("lightPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_shadowPlayerId_fkey" FOREIGN KEY ("shadowPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveRecord" ADD CONSTRAINT "MoveRecord_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSnapshot" ADD CONSTRAINT "MatchSnapshot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
