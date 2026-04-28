-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "chipId" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "carOrder" INTEGER[],
    "tutorials" INTEGER NOT NULL,
    "userBanned" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "hasHp600Count" INTEGER NOT NULL DEFAULT 0,
    "competitionUserState" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "teamId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "numOfStickers" INTEGER NOT NULL,
    "leaderUserId" INTEGER NOT NULL,
    "stickerFont" INTEGER NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "dissolved" BOOLEAN NOT NULL,
    "fullfilled" BOOLEAN NOT NULL,
    "recruitmentSuspended" BOOLEAN NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("teamId")
);

-- CreateTable
CREATE TABLE "TeamApplicant" (
    "dbId" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "applicantUserId" INTEGER NOT NULL,
    "expiresAt" INTEGER NOT NULL,

    CONSTRAINT "TeamApplicant_pkey" PRIMARY KEY ("dbId")
);

--CeateTable
CREATE TABLE "TeamSticker" (
    "dbId" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "opponentTeamId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamSticker_pkey" PRIMARY KEY ("dbId")
);

--CeateTable
CREATE TABLE "TeamStickersEarned" (
    "dbId" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "opponentTeamId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" INTEGER NOT NULL,

    CONSTRAINT "TeamStickersEarned_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "Car" (
    "carId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL DEFAULT 1,
    "manufacturer" INTEGER NOT NULL,
    "model" INTEGER NOT NULL,
    "visualModel" INTEGER NOT NULL,
    "defaultColor" INTEGER NOT NULL,
    "customColor" INTEGER NOT NULL DEFAULT 0,
    "wheel" INTEGER NOT NULL DEFAULT 0,
    "wheelColor" INTEGER NOT NULL DEFAULT 0,
    "aero" INTEGER NOT NULL DEFAULT 0,
    "bonnet" INTEGER NOT NULL DEFAULT 0,
    "wing" INTEGER NOT NULL DEFAULT 0,
    "mirror" INTEGER NOT NULL DEFAULT 0,
    "sticker" INTEGER NOT NULL DEFAULT 0,
    "stickerColor" INTEGER NOT NULL DEFAULT 0,
    "neon" INTEGER NOT NULL DEFAULT 0,
    "trunk" INTEGER NOT NULL DEFAULT 0,
    "plate" INTEGER NOT NULL DEFAULT 0,
    "plateColor" INTEGER NOT NULL DEFAULT 0,
    "specialSticker" INTEGER NOT NULL DEFAULT 0,
    "specialStickerColor" INTEGER NOT NULL DEFAULT 0,
    "tunePower" INTEGER NOT NULL DEFAULT 0,
    "tuneHandling" INTEGER NOT NULL DEFAULT 0,
    "title" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedPlaceId" INTEGER,
    "aura" INTEGER NOT NULL DEFAULT 0,
    "ghostLevel" INTEGER NOT NULL DEFAULT 1,
    "country" TEXT NOT NULL DEFAULT 'JPN',
    "searchCode" TEXT NOT NULL,
    "tuningPoint" INTEGER NOT NULL DEFAULT 0,
    "odometer" INTEGER NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "earnedCustomColor" BOOLEAN NOT NULL DEFAULT false,
    "ownedCustomColors" INTEGER NOT NULL DEFAULT 0,
    "ownedDressupParts" INTEGER NOT NULL DEFAULT 0,
    "ownedMeters" INTEGER NOT NULL DEFAULT 0,
    "ownedBgm" INTEGER NOT NULL DEFAULT 0,
    "ownedNameplates" INTEGER NOT NULL DEFAULT 0,
    "carSettingsDbId" INTEGER NOT NULL,
    "vsPlayCount" INTEGER NOT NULL DEFAULT 0,
    "vsBurstCount" INTEGER NOT NULL DEFAULT 0,
    "vsStarCount" INTEGER NOT NULL DEFAULT 0,
    "vsStarCountMax" INTEGER NOT NULL DEFAULT 0,
    "vsCoolOrWild" INTEGER NOT NULL DEFAULT 0,
    "vsSmoothOrRough" INTEGER NOT NULL DEFAULT 0,
    "rgPlayCount" INTEGER NOT NULL DEFAULT 0,
    "rgWinCount" INTEGER NOT NULL DEFAULT 0,
    "maxiCoin" INTEGER NOT NULL DEFAULT 0,
    "rgScore" INTEGER NOT NULL DEFAULT 0,
    "rgBlock" INTEGER NOT NULL DEFAULT 0,
    "rgProgress" INTEGER[],
    "rgClearCount" INTEGER NOT NULL DEFAULT 0,
    "rgConsecutiveLosses" INTEGER NOT NULL DEFAULT 0,
    "rgAcquireAllCrowns" BOOLEAN NOT NULL DEFAULT false,
    "dressupLevel" INTEGER NOT NULL DEFAULT 0,
    "dressupPoint" INTEGER NOT NULL DEFAULT 0,
    "stPlayCount" INTEGER NOT NULL DEFAULT 0,
    "stClearBits" INTEGER NOT NULL DEFAULT 0,
    "stClearDivCount" INTEGER NOT NULL DEFAULT 0,
    "stClearCount" INTEGER NOT NULL DEFAULT 0,
    "stLoseBits" BIGINT NOT NULL DEFAULT 0,
    "stLose" BOOLEAN NOT NULL DEFAULT false,
    "stConsecutiveWins" INTEGER NOT NULL DEFAULT 0,
    "stConsecutiveWinsMax" INTEGER NOT NULL DEFAULT 0,
    "teamId" INTEGER NOT NULL DEFAULT 0,
    "teamName" TEXT NOT NULL DEFAULT 'ＷＡＮＧＡＮ',
    "teamSticker" BOOLEAN NOT NULL DEFAULT true,
    "stickerFont" INTEGER NOT NULL DEFAULT 1,
    "carStateDbId" INTEGER NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("carId")
);

-- CreateTable
CREATE TABLE "CarSettings" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "view" BOOLEAN NOT NULL DEFAULT true,
    "transmission" BOOLEAN NOT NULL DEFAULT false,
    "retire" BOOLEAN NOT NULL DEFAULT false,
    "meter" INTEGER NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 2,
    "bgm" INTEGER NOT NULL DEFAULT 0,
    "nameplate" INTEGER NOT NULL DEFAULT 0,
    "nameplateColor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CarSettings_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "CarState" (
    "dbId" SERIAL NOT NULL,
    "hasOpponentGhost" BOOLEAN NOT NULL DEFAULT false,
    "competitionState" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CarState_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "FriendCar" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "friendCarId" INTEGER NOT NULL,
    "friendshipLevel" INTEGER NOT NULL,
    "revengeLevel" INTEGER NOT NULL,

    CONSTRAINT "FriendCar_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "TimeAttackRecord" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "model" INTEGER NOT NULL,
    "time" INTEGER NOT NULL,
    "course" INTEGER NOT NULL,
    "isMorning" BOOLEAN NOT NULL DEFAULT true,
    "tunePower" INTEGER NOT NULL DEFAULT 0,
    "tuneHandling" INTEGER NOT NULL DEFAULT 0,
    "playedAt" INTEGER NOT NULL DEFAULT 0,
    "section1Time" INTEGER NOT NULL,
    "section2Time" INTEGER NOT NULL,
    "section3Time" INTEGER NOT NULL,
    "section4Time" INTEGER NOT NULL,
    "section5Time" INTEGER,
    "section6Time" INTEGER,
    "section7Time" INTEGER,

    CONSTRAINT "TimeAttackRecord_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostBattleRecord" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "area" INTEGER NOT NULL DEFAULT 0,
    "tunePower" INTEGER NOT NULL DEFAULT 0,
    "tuneHandling" INTEGER NOT NULL DEFAULT 0,
    "playedAt" INTEGER NOT NULL DEFAULT 0,
    "playedShopName" TEXT NOT NULL DEFAULT 'Bayshore',
    "opponentCarId" INTEGER NOT NULL,
    "opponentResult" INTEGER NOT NULL,

    CONSTRAINT "GhostBattleRecord_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCrown" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "tunePower" INTEGER NOT NULL,
    "tuneHandling" INTEGER NOT NULL,
    "playedAt" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GhostCrown_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostTrail" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "ramp" INTEGER NOT NULL,
    "tunePower" INTEGER NOT NULL DEFAULT 0,
    "tuneHandling" INTEGER NOT NULL DEFAULT 0,
    "playedAt" INTEGER NOT NULL DEFAULT 0,
    "crownBattle" BOOLEAN NOT NULL DEFAULT false,
    "trail" BYTEA NOT NULL,

    CONSTRAINT "GhostTrail_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostRevenger" (
    "id" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "revengerCarId" INTEGER NOT NULL,
    "result" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "revengeLevel" INTEGER NOT NULL,
    "lastPlayedAt" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GhostRevenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceList" (
    "id" SERIAL NOT NULL,
    "placeId" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "shopName" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "PlaceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhostCompetitionSchedule" (
    "dbId" SERIAL NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "qualifyingPeriodStartAt" INTEGER NOT NULL,
    "qualifyingPeriodCloseAt" INTEGER NOT NULL,
    "competitionStartAt" INTEGER NOT NULL,
    "competitionCloseAt" INTEGER NOT NULL,
    "competitionEndAt" INTEGER NOT NULL,
    "lengthOfPeriod" INTEGER NOT NULL,
    "lengthOfInterval" INTEGER NOT NULL,
    "area" INTEGER NOT NULL DEFAULT 0,
    "minigamePatternId" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GhostCompetitionSchedule_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionSchedulePeriod" (
    "dbId" SERIAL NOT NULL,
    "competitionDbId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "startAt" INTEGER NOT NULL,
    "closeAt" INTEGER NOT NULL,

    CONSTRAINT "GhostCompetitionSchedulePeriod_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionBattleRecord" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "model" INTEGER NOT NULL,
    "visualModel" INTEGER NOT NULL,
    "defaultColor" INTEGER NOT NULL,
    "title" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "competitionDbId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "result" INTEGER NOT NULL,
    "playedAt" INTEGER NOT NULL DEFAULT 0,
    "playedShopName" TEXT NOT NULL DEFAULT 'Bayshore',
    "brakingPoint" INTEGER,

    CONSTRAINT "GhostCompetitionBattleRecord_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionTally" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "result" INTEGER NOT NULL,

    CONSTRAINT "GhostCompetitionTally_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionTarget" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "competitionDbId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,

    CONSTRAINT "GhostCompetitionTarget_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionTargetGhostTrail" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "competitionDbId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "ramp" INTEGER NOT NULL,
    "tunePower" INTEGER NOT NULL DEFAULT 0,
    "tuneHandling" INTEGER NOT NULL DEFAULT 0,
    "playedAt" INTEGER NOT NULL DEFAULT 0,
    "trail" BYTEA NOT NULL,

    CONSTRAINT "GhostCompetitionTargetGhostTrail_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionDevGhostTrail" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "competitionDbId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "ramp" INTEGER NOT NULL,
    "tunePower" INTEGER NOT NULL DEFAULT 0,
    "tuneHandling" INTEGER NOT NULL DEFAULT 0,
    "playedAt" INTEGER NOT NULL DEFAULT 0,
    "trail" BYTEA NOT NULL,

    CONSTRAINT "GhostCompetitionDevGhostTrail_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionGhostTrail" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "competitionDbId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "area" INTEGER NOT NULL,
    "ramp" INTEGER NOT NULL,
    "tunePower" INTEGER NOT NULL DEFAULT 0,
    "tuneHandling" INTEGER NOT NULL DEFAULT 0,
    "playedAt" INTEGER NOT NULL DEFAULT 0,
    "trail" BYTEA NOT NULL,

    CONSTRAINT "GhostCompetitionGhostTrail_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "GhostCompetitionRegisteredFromTerminal" (
    "dbId" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "competitionDbId" INTEGER NOT NULL,
    "opponentCarId" INTEGER NOT NULL,

    CONSTRAINT "GhostCompetitionRegisteredFromTerminal_pkey" PRIMARY KEY ("dbId")
);

-- CreateTable
CREATE TABLE "FileList" (
    "fileId" SERIAL NOT NULL,
    "fileType" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "urlFileName" TEXT NOT NULL,
    "sha1sum" TEXT NOT NULL,
    "notBefore" INTEGER NOT NULL,
    "notAfter" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,

    CONSTRAINT "FileList_pkey" PRIMARY KEY ("fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_chipId_key" ON "User"("chipId");

-- CreateIndex
CREATE UNIQUE INDEX "Car_searchCode_key" ON "Car"("searchCode");

-- CreateIndex
CREATE UNIQUE INDEX "Car_carSettingsDbId_key" ON "Car"("carSettingsDbId");

-- CreateIndex
CREATE UNIQUE INDEX "Car_carStateDbId_key" ON "Car"("carStateDbId");

-- CreateIndex
CREATE UNIQUE INDEX "GhostCrown_area_key" ON "GhostCrown"("area");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_carSettingsDbId_fkey" FOREIGN KEY ("carSettingsDbId") REFERENCES "CarSettings"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_carStateDbId_fkey" FOREIGN KEY ("carStateDbId") REFERENCES "CarState"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_lastPlayedPlaceId_fkey" FOREIGN KEY ("lastPlayedPlaceId") REFERENCES "PlaceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAttackRecord" ADD CONSTRAINT "TimeAttackRecord_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostBattleRecord" ADD CONSTRAINT "GhostBattleRecord_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostTrail" ADD CONSTRAINT "GhostTrail_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionSchedulePeriod" ADD CONSTRAINT "GhostCompetitionSchedulePeriod_competitionDbId_fkey" FOREIGN KEY ("competitionDbId") REFERENCES "GhostCompetitionSchedule"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionBattleRecord" ADD CONSTRAINT "GhostCompetitionBattleRecord_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionBattleRecord" ADD CONSTRAINT "GhostCompetitionBattleRecord_competitionDbId_fkey" FOREIGN KEY ("competitionDbId") REFERENCES "GhostCompetitionSchedule"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionTally" ADD CONSTRAINT "GhostCompetitionTally_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionTally" ADD CONSTRAINT "GhostCompetitionTally_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "GhostCompetitionSchedule"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionTarget" ADD CONSTRAINT "GhostCompetitionTarget_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionTarget" ADD CONSTRAINT "GhostCompetitionTarget_competitionDbId_fkey" FOREIGN KEY ("competitionDbId") REFERENCES "GhostCompetitionSchedule"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionGhostTrail" ADD CONSTRAINT "GhostCompetitionGhostTrail_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionGhostTrail" ADD CONSTRAINT "GhostCompetitionGhostTrail_competitionDbId_fkey" FOREIGN KEY ("competitionDbId") REFERENCES "GhostCompetitionSchedule"("dbId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostCompetitionRegisteredFromTerminal" ADD CONSTRAINT "GhostCompetitionRegisteredFromTerminal_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("carId") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (1, 999999999, 0, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (2, 999999999, 1, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (3, 999999999, 2, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (4, 999999999, 3, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (5, 999999999, 4, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (6, 999999999, 5, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (7, 999999999, 6, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (8, 999999999, 7, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (9, 999999999, 8, 0, 0, 0);
INSERT INTO "public"."GhostCrown" ("dbId", "carId", "area", "tunePower", "tuneHandling", "playedAt") VALUES (10, 999999999, 9, 0, 0, 0);
