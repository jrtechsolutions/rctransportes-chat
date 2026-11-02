-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('agente', 'supervisor');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('ocorrencia', 'conversa');

-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('aguardando', 'em_atendimento', 'encerrada');

-- CreateEnum
CREATE TYPE "DirecaoMensagem" AS ENUM ('entrada', 'saida');

-- CreateTable
CREATE TABLE "setores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp_phone_number_id" TEXT,
    "sla_minutos" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "microsoft_oid" TEXT,
    "papel" "Papel" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_setores" (
    "usuario_id" TEXT NOT NULL,
    "setor_id" TEXT NOT NULL,

    CONSTRAINT "usuario_setores_pkey" PRIMARY KEY ("usuario_id","setor_id")
);

-- CreateTable
CREATE TABLE "motoristas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "placa" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "motoristas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAtendimento" NOT NULL,
    "setor_id" TEXT,
    "contato_telefone" TEXT NOT NULL,
    "contato_nome" TEXT,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'aguardando',
    "assumido_por" TEXT,
    "sla_vence_em" TIMESTAMP(3),
    "motorista_nao_identificado" BOOLEAN NOT NULL DEFAULT false,
    "conversa_limpa_por" TEXT,
    "conversa_limpa_em" TIMESTAMP(3),
    "aguardando_menu" BOOLEAN NOT NULL DEFAULT false,
    "menu_enviado_em" TIMESTAMP(3),
    "menu_lembrete_enviado_em" TIMESTAMP(3),
    "ultima_mensagem_preview" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "atendimento_id" TEXT NOT NULL,
    "direcao" "DirecaoMensagem" NOT NULL,
    "remetente_usuario_id" TEXT,
    "conteudo" TEXT,
    "whatsapp_message_id" TEXT,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias" (
    "id" TEXT NOT NULL,
    "atendimento_id" TEXT NOT NULL,
    "de_setor_id" TEXT NOT NULL,
    "para_setor_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transferencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_microsoft_oid_key" ON "usuarios"("microsoft_oid");

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_telefone_key" ON "motoristas"("telefone");

-- CreateIndex
CREATE INDEX "atendimentos_setor_id_status_idx" ON "atendimentos"("setor_id", "status");

-- CreateIndex
CREATE INDEX "atendimentos_contato_telefone_idx" ON "atendimentos"("contato_telefone");

-- CreateIndex
CREATE INDEX "atendimentos_status_idx" ON "atendimentos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_whatsapp_message_id_key" ON "mensagens"("whatsapp_message_id");

-- CreateIndex
CREATE INDEX "mensagens_atendimento_id_enviado_em_idx" ON "mensagens"("atendimento_id", "enviado_em");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "refresh_tokens"("usuario_id");

-- AddForeignKey
ALTER TABLE "usuario_setores" ADD CONSTRAINT "usuario_setores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_setores" ADD CONSTRAINT "usuario_setores_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_assumido_por_fkey" FOREIGN KEY ("assumido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_conversa_limpa_por_fkey" FOREIGN KEY ("conversa_limpa_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_atendimento_id_fkey" FOREIGN KEY ("atendimento_id") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetente_usuario_id_fkey" FOREIGN KEY ("remetente_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_atendimento_id_fkey" FOREIGN KEY ("atendimento_id") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_de_setor_id_fkey" FOREIGN KEY ("de_setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_para_setor_id_fkey" FOREIGN KEY ("para_setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
