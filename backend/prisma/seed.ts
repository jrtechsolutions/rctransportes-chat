import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const prisma = new PrismaClient();

async function ensureNumerosWhatsapp() {
  const phoneClientes = process.env.WHATSAPP_PHONE_NUMBER_ID_CLIENTE?.trim() ?? '';
  const phoneMotorista = process.env.WHATSAPP_PHONE_NUMBER_ID_OPERACIONAL?.trim() ?? '';

  const clientes = await prisma.numeroWhatsapp.upsert({
    where: { uso: 'clientes' },
    create: { uso: 'clientes', phoneNumberId: phoneClientes },
    update: phoneClientes ? { phoneNumberId: phoneClientes } : {},
  });

  const motorista = await prisma.numeroWhatsapp.upsert({
    where: { uso: 'motorista' },
    create: { uso: 'motorista', phoneNumberId: phoneMotorista },
    update: phoneMotorista ? { phoneNumberId: phoneMotorista } : {},
  });

  console.log(`Números WhatsApp: clientes=${clientes.id}, motorista=${motorista.id}`);
  return { clientes, motorista };
}

async function main() {
  const { clientes, motorista } = await ensureNumerosWhatsapp();

  const setoresSeed = [
    { nome: 'Operacional', slaMinutos: 10, numeroWhatsappId: motorista.id },
    { nome: 'Comercial', slaMinutos: 15, numeroWhatsappId: clientes.id },
    { nome: 'Financeiro', slaMinutos: 20, numeroWhatsappId: clientes.id },
  ];

  for (const s of setoresSeed) {
    const exists = await prisma.setor.findFirst({
      where: { nome: { equals: s.nome, mode: 'insensitive' } },
    });
    if (!exists) {
      await prisma.setor.create({ data: s });
      console.log(`Setor criado: ${s.nome}`);
    } else if (!exists.numeroWhatsappId) {
      await prisma.setor.update({
        where: { id: exists.id },
        data: { numeroWhatsappId: s.numeroWhatsappId },
      });
      console.log(`Setor vinculado ao número: ${s.nome}`);
    }
  }

  // Garante regra de negócio: Comercial e Financeiro → clientes; Operacional → motorista
  await prisma.setor.updateMany({
    where: { nome: { equals: 'Comercial', mode: 'insensitive' } },
    data: { numeroWhatsappId: clientes.id },
  });
  await prisma.setor.updateMany({
    where: { nome: { equals: 'Financeiro', mode: 'insensitive' } },
    data: { numeroWhatsappId: clientes.id },
  });
  await prisma.setor.updateMany({
    where: { nome: { equals: 'Operacional', mode: 'insensitive' } },
    data: { numeroWhatsappId: motorista.id },
  });

  const allSetores = await prisma.setor.findMany();

  const testUsers = [
    {
      email: 'supervisor@teste.local',
      nome: 'Supervisor Teste',
      papel: 'supervisor' as const,
    },
    {
      email: 'agente@teste.local',
      nome: 'Agente Teste',
      papel: 'agente' as const,
    },
  ];

  for (const u of testUsers) {
    const exists = await prisma.usuario.findUnique({ where: { email: u.email } });
    if (!exists) {
      const setorIds =
        u.papel === 'supervisor'
          ? allSetores
          : allSetores.filter((s) => s.nome === 'Comercial');
      await prisma.usuario.create({
        data: {
          nome: u.nome,
          email: u.email,
          papel: u.papel,
          ativo: true,
          setores: {
            create: setorIds.map((s) => ({ setorId: s.id })),
          },
        },
      });
      console.log(`Usuário teste criado: ${u.email} (${u.papel})`);
    }
  }

  const supervisorEmail = process.env.SEED_SUPERVISOR_EMAIL;
  if (supervisorEmail) {
    const email = supervisorEmail.toLowerCase();
    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (!exists) {
      await prisma.usuario.create({
        data: {
          nome: process.env.SEED_SUPERVISOR_NOME ?? 'Supervisor',
          email,
          papel: 'supervisor',
          ativo: true,
          setores: {
            create: allSetores.map((s) => ({ setorId: s.id })),
          },
        },
      });
      console.log(`Supervisor seed: ${email}`);
    }
  }

  console.log('Seed concluído.');
  console.log('Login teste: supervisor@teste.local / senha do DEV_LOGIN_PASSWORD (padrão: teste123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
