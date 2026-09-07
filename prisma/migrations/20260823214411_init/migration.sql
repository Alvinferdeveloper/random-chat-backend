-- CreateEnum
CREATE TYPE "public"."RoomStatus" AS ENUM ('IN_REVISION', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'HATE_SPEECH', 'ANNOYING_BEHAVIOR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AgeRange" AS ENUM ('RANGE_19_24', 'RANGE_25_34', 'RANGE_35_44', 'RANGE_45_PLUS');

-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('CASUAL', 'DEEP', 'LEARNING', 'SHARING_EXPERIENCES');

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(45) NOT NULL,
    "normalized_name" VARCHAR(60) NOT NULL DEFAULT '',
    "short_description" VARCHAR(45) NOT NULL,
    "full_description" VARCHAR(300) NOT NULL,
    "server_banner" VARCHAR(200) NOT NULL,
    "server_icon" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."RoomStatus" NOT NULL DEFAULT 'IN_REVISION',
    "deletedAt" TIMESTAMP(3),
    "ownerId" CHAR(36),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorite_room" (
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_room_pkey" PRIMARY KEY ("userId","roomId")
);

-- CreateTable
CREATE TABLE "public"."user_room_activity" (
    "userId" CHAR(36) NOT NULL,
    "roomId" CHAR(36) NOT NULL,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interactionCount" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "username" TEXT,
    "bio" VARCHAR(255),
    "location" TEXT,
    "ageRange" "public"."AgeRange",
    "conversationType" "public"."ConversationType",
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "roomId" CHAR(36),
    "reason" "public"."ReportReason" NOT NULL,
    "details" VARCHAR(255),
    "chatContext" JSONB,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorite_gif" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "giphyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_gif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Hobby" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" VARCHAR(200),

    CONSTRAINT "Hobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" VARCHAR(200),

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_category" (
    "roomId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "room_category_pkey" PRIMARY KEY ("roomId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."global_setting" (
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "description" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."_HobbyToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HobbyToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_normalized_name_key" ON "public"."Room"("normalized_name");

-- CreateIndex
CREATE INDEX "Room_deletedAt_status_idx" ON "public"."Room"("deletedAt", "status");

-- CreateIndex
CREATE INDEX "Room_status_deletedAt_created_at_idx" ON "public"."Room"("status", "deletedAt", "created_at");

-- CreateIndex
CREATE INDEX "Room_normalized_name_idx" ON "public"."Room"("normalized_name");

-- CreateIndex
CREATE INDEX "Room_created_at_idx" ON "public"."Room"("created_at");

-- CreateIndex
CREATE INDEX "user_room_activity_userId_lastInteraction_idx" ON "public"."user_room_activity"("userId", "lastInteraction");

-- CreateIndex
CREATE INDEX "user_room_activity_roomId_lastInteraction_idx" ON "public"."user_room_activity"("roomId", "lastInteraction");

-- CreateIndex
CREATE UNIQUE INDEX "user_room_activity_userId_roomId_key" ON "public"."user_room_activity"("userId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "public"."user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "report_reportedUserId_status_idx" ON "public"."report"("reportedUserId", "status");

-- CreateIndex
CREATE INDEX "report_status_idx" ON "public"."report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_gif_userId_giphyId_key" ON "public"."favorite_gif"("userId", "giphyId");

-- CreateIndex
CREATE UNIQUE INDEX "Hobby_name_key" ON "public"."Hobby"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "public"."category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE INDEX "_HobbyToUser_B_index" ON "public"."_HobbyToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorite_room" ADD CONSTRAINT "favorite_room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorite_room" ADD CONSTRAINT "favorite_room_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_room_activity" ADD CONSTRAINT "user_room_activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_room_activity" ADD CONSTRAINT "user_room_activity_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report" ADD CONSTRAINT "report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report" ADD CONSTRAINT "report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report" ADD CONSTRAINT "report_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorite_gif" ADD CONSTRAINT "favorite_gif_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_category" ADD CONSTRAINT "room_category_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_category" ADD CONSTRAINT "room_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HobbyToUser" ADD CONSTRAINT "_HobbyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Hobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HobbyToUser" ADD CONSTRAINT "_HobbyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
