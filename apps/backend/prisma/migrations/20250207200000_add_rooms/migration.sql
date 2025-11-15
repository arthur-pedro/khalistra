-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'READY', 'IN_MATCH', 'CLOSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "matchId" TEXT,
    "hostPlayerId" TEXT NOT NULL,
    "guestPlayerId" TEXT,
    "hostDisplayName" TEXT NOT NULL,
    "guestDisplayName" TEXT,
    "hostSecret" TEXT NOT NULL,
    "guestSecret" TEXT,
    "hostJoinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestJoinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");
CREATE UNIQUE INDEX "rooms_matchId_key" ON "rooms"("matchId");
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostPlayerId_fkey" FOREIGN KEY ("hostPlayerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_guestPlayerId_fkey" FOREIGN KEY ("guestPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
