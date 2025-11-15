/*
  Warnings:

  - You are about to drop the `Match` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MatchSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MoveRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_lightPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_shadowPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "MatchSnapshot" DROP CONSTRAINT "MatchSnapshot_matchId_fkey";

-- DropForeignKey
ALTER TABLE "MoveRecord" DROP CONSTRAINT "MoveRecord_matchId_fkey";

-- DropTable
DROP TABLE "Match";

-- DropTable
DROP TABLE "MatchSnapshot";

-- DropTable
DROP TABLE "MoveRecord";

-- DropTable
DROP TABLE "Player";

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "lightPlayerId" TEXT NOT NULL,
    "shadowPlayerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting',
    "activePlayerId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL DEFAULT 1,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_records" (
    "id" SERIAL NOT NULL,
    "matchId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_snapshots" (
    "id" SERIAL NOT NULL,
    "matchId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "kind" "SnapshotKind" NOT NULL DEFAULT 'RUNTIME',
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_alias_key" ON "players"("alias");

-- CreateIndex
CREATE INDEX "matches_lightPlayerId_idx" ON "matches"("lightPlayerId");

-- CreateIndex
CREATE INDEX "matches_shadowPlayerId_idx" ON "matches"("shadowPlayerId");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "move_records_matchId_idx" ON "move_records"("matchId");

-- CreateIndex
CREATE INDEX "move_records_matchId_turn_idx" ON "move_records"("matchId", "turn");

-- CreateIndex
CREATE INDEX "match_snapshots_matchId_idx" ON "match_snapshots"("matchId");

-- CreateIndex
CREATE INDEX "match_snapshots_matchId_turn_idx" ON "match_snapshots"("matchId", "turn");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_lightPlayerId_fkey" FOREIGN KEY ("lightPlayerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_shadowPlayerId_fkey" FOREIGN KEY ("shadowPlayerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_records" ADD CONSTRAINT "move_records_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_snapshots" ADD CONSTRAINT "match_snapshots_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
