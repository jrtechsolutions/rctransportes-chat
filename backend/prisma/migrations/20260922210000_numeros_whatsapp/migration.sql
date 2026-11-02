-- CreateEnum
CREATE TYPE "UsoNumeroWhatsapp" AS ENUM ('clientes', 'motorista');

-- CreateTable
CREATE TABLE "numeros_whatsapp" (
    "id" TEXT NOT NULL,
    "uso" "UsoNumeroWhatsapp" NOT NULL,
    "phone_number_id" TEXT NOT NULL,

    CONSTRAINT "numeros_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "numeros_whatsapp_uso_key" ON "numeros_whatsapp"("uso");

-- Seed dos dois números (IDs técnicos preenchidos depois pela seed/env ou pela tela)
INSERT INTO "numeros_whatsapp" ("id", "uso", "phone_number_id")
VALUES
  ('seed_wa_clientes', 'clientes', ''),
  ('seed_wa_motorista', 'motorista', '');

-- AlterTable setores: adiciona FK
ALTER TABLE "setores" ADD COLUMN "numero_whatsapp_id" TEXT;

-- Migra dados existentes: Operacional → motorista; demais → clientes
UPDATE "setores"
SET "numero_whatsapp_id" = CASE
  WHEN LOWER("nome") = 'operacional' THEN 'seed_wa_motorista'
  ELSE 'seed_wa_clientes'
END;

ALTER TABLE "setores" ADD CONSTRAINT "setores_numero_whatsapp_id_fkey"
  FOREIGN KEY ("numero_whatsapp_id") REFERENCES "numeros_whatsapp"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove campo texto livre antigo
ALTER TABLE "setores" DROP COLUMN "whatsapp_phone_number_id";
