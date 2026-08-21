-- Ideasoft API taklidi için ID eşleme tabloları.
-- Entegra (e-fatura entegratörü) admin-api'yi integer ID ile çağırır;
-- Sadoksan cuid kullandığından bu tablolar köprü görevi görür.

-- Aşama 1: Geçiş sonrası Sadoksan'da oluşan kayıtların integer ID eşlemesi
CREATE TABLE "ideasoft_id_mapping" (
    "id" SERIAL NOT NULL,
    "entityType" VARCHAR(32) NOT NULL,
    "sadoksanId" VARCHAR(64) NOT NULL,
    "ideasoftId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ideasoft_id_mapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ideasoft_id_mapping_entityType_sadoksanId_key" ON "ideasoft_id_mapping"("entityType", "sadoksanId");

CREATE UNIQUE INDEX "ideasoft_id_mapping_entityType_ideasoftId_key" ON "ideasoft_id_mapping"("entityType", "ideasoftId");

-- Aşama 2: Eski Ideasoft'tan alınan orijinal integer ID'lerin eşlemesi
CREATE TABLE "ideasoft_legacy_id" (
    "entityType" VARCHAR(32) NOT NULL,
    "legacyIdeasoftId" INTEGER NOT NULL,
    "sadoksanId" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ideasoft_legacy_id_pkey" PRIMARY KEY ("entityType", "legacyIdeasoftId")
);

CREATE INDEX "ideasoft_legacy_id_entityType_sadoksanId_idx" ON "ideasoft_legacy_id"("entityType", "sadoksanId");
