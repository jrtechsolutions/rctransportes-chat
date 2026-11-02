-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO');

-- CreateTable
CREATE TABLE "chamados" (
    "id" TEXT NOT NULL,
    "cliente_nome" TEXT NOT NULL,
    "cliente_email" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "nota_fiscal" TEXT,
    "tipo_veiculo" TEXT NOT NULL,
    "peso" TEXT NOT NULL,
    "horario_limite" TEXT NOT NULL,
    "email_original_texto" TEXT NOT NULL,
    "status" "StatusChamado" NOT NULL DEFAULT 'ABERTO',
    "criado_por_id" TEXT NOT NULL,
    "assumido_por_id" TEXT,
    "resolvido_em" TIMESTAMP(3),
    "email_confirmacao_enviado_em" TIMESTAMP(3),
    "email_confirmacao_erro" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chamados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamado_observacoes" (
    "id" TEXT NOT NULL,
    "chamado_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamado_observacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chamados_status_criado_em_idx" ON "chamados"("status", "criado_em");

-- CreateIndex
CREATE INDEX "chamado_observacoes_chamado_id_criado_em_idx" ON "chamado_observacoes"("chamado_id", "criado_em");

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_assumido_por_id_fkey" FOREIGN KEY ("assumido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamado_observacoes" ADD CONSTRAINT "chamado_observacoes_chamado_id_fkey" FOREIGN KEY ("chamado_id") REFERENCES "chamados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamado_observacoes" ADD CONSTRAINT "chamado_observacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
