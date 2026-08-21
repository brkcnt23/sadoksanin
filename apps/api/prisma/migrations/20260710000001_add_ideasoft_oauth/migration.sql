-- Ideasoft API taklidi — OAuth2 authorization_code akışı için tablolar.
-- Access token stateless JWT (24h) olduğundan saklanmaz.

-- Kısa ömürlü authorization code (/panel/auth → /oauth/v2/token değişimi)
CREATE TABLE "ideasoft_auth_code" (
    "code" VARCHAR(128) NOT NULL,
    "clientId" VARCHAR(255) NOT NULL,
    "redirectUri" VARCHAR(500) NOT NULL,
    "scope" VARCHAR(500) NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ideasoft_auth_code_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "ideasoft_auth_code_expiresAt_idx" ON "ideasoft_auth_code"("expiresAt");

-- Uzun ömürlü (2 ay) refresh token
CREATE TABLE "ideasoft_token" (
    "id" TEXT NOT NULL,
    "refreshToken" VARCHAR(128) NOT NULL,
    "clientId" VARCHAR(255) NOT NULL,
    "scope" VARCHAR(500) NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ideasoft_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ideasoft_token_refreshToken_key" ON "ideasoft_token"("refreshToken");

CREATE INDEX "ideasoft_token_clientId_idx" ON "ideasoft_token"("clientId");
