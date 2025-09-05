-- CreateTable
CREATE TABLE "public"."VeoPrompt" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(180),
    "ideaHash" TEXT NOT NULL,
    "userId" TEXT,
    "provider" TEXT,
    "activeVersionId" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VeoPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VeoPromptVersion" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "meta" JSONB NOT NULL,
    "story" JSONB NOT NULL,
    "visuals" JSONB NOT NULL,
    "audio" JSONB NOT NULL,
    "branding" JSONB NOT NULL,
    "deliverables" JSONB NOT NULL,
    "providerJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VeoPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VeoPrompt_userId_idx" ON "public"."VeoPrompt"("userId");

-- CreateIndex
CREATE INDEX "VeoPrompt_isTemplate_idx" ON "public"."VeoPrompt"("isTemplate");

-- CreateIndex
CREATE UNIQUE INDEX "VeoPrompt_ideaHash_userId_key" ON "public"."VeoPrompt"("ideaHash", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VeoPromptVersion_promptId_version_key" ON "public"."VeoPromptVersion"("promptId", "version");

-- AddForeignKey
ALTER TABLE "public"."VeoPrompt" ADD CONSTRAINT "VeoPrompt_activeVersionId_fkey" FOREIGN KEY ("activeVersionId") REFERENCES "public"."VeoPromptVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VeoPromptVersion" ADD CONSTRAINT "VeoPromptVersion_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "public"."VeoPrompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
