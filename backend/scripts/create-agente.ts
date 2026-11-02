import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let setores = await prisma.setor.findMany();
  if (setores.length === 0) {
    for (const s of [
      { nome: 'Operacional', slaMinutos: 10 },
      { nome: 'Comercial', slaMinutos: 15 },
      { nome: 'Financeiro', slaMinutos: 20 },
    ]) {
      await prisma.setor.create({ data: s });
      console.log('Setor criado:', s.nome);
    }
    setores = await prisma.setor.findMany();
  }

  const comercial = setores.filter((s) => s.nome.toLowerCase() === 'comercial');
  const email = 'agente@teste.local';

  let user = await prisma.usuario.findUnique({
    where: { email },
    include: { setores: { include: { setor: true } } },
  });

  if (!user) {
    user = await prisma.usuario.create({
      data: {
        nome: 'Agente Teste',
        email,
        papel: 'agente',
        ativo: true,
        setores: {
          create: (comercial.length ? comercial : setores.slice(0, 1)).map((s) => ({
            setorId: s.id,
          })),
        },
      },
      include: { setores: { include: { setor: true } } },
    });
    console.log('Usuário agente criado.');
  } else {
    await prisma.usuario.update({
      where: { id: user.id },
      data: { ativo: true, papel: 'agente', nome: 'Agente Teste' },
    });
    if (user.setores.length === 0) {
      const alvo = comercial[0] ?? setores[0];
      if (alvo) {
        await prisma.usuarioSetor.create({
          data: { usuarioId: user.id, setorId: alvo.id },
        });
      }
    }
    user = await prisma.usuario.findUniqueOrThrow({
      where: { email },
      include: { setores: { include: { setor: true } } },
    });
    console.log('Usuário agente já existia — atualizado.');
  }

  console.log('---');
  console.log('E-mail:', user.email);
  console.log('Senha:  teste123  (DEV_LOGIN_PASSWORD)');
  console.log('Papel: ', user.papel);
  console.log(
    'Setores:',
    user.setores.map((s) => s.setor.nome).join(', ') || '(nenhum)',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
