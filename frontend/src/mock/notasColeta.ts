import { montarChave } from '../lib/danfe';
import type { NotaColeta } from './types';

function chave(cnpj: string, numero: number, serie = 1, codigo = '40718253') {
  return montarChave({ cnpj, aamm: '2611', serie, numero, codigo });
}

/** Troca um dígito no meio da chave — simula leitura errada do texto impresso */
function comDigitoErrado(c: string) {
  const i = 30;
  return c.slice(0, i) + ((Number(c[i]) + 3) % 10) + c.slice(i + 1);
}

export const NOTAS_COLETA: NotaColeta[] = [
  {
    id: 'n1',
    recebidaEm: '03/11/2026 09:42',
    remetente: 'José da Silva',
    tipoRemetente: 'Motorista',
    telefone: '(19) 98877-1100',
    emitente: 'Distribuidora ABC Ltda',
    cnpj: '12345678000190',
    numero: '45281',
    serie: '1',
    chave: chave('12345678000190', 45281),
    leitura: 'Código de barras',
    confirmadaPor: null,
  },
  {
    id: 'n2',
    recebidaEm: '03/11/2026 09:15',
    remetente: 'Diego Santos',
    tipoRemetente: 'Ajudante',
    telefone: '(19) 99410-2288',
    emitente: 'Alimentos Vale Verde Ltda',
    cnpj: '34567890000112',
    numero: '77821',
    serie: '1',
    chave: chave('34567890000112', 77821, 1, '18273645'),
    leitura: 'IA (texto impresso)',
    confirmadaPor: null,
  },
  {
    id: 'n3',
    recebidaEm: '03/11/2026 08:58',
    remetente: 'Ricardo Ferreira',
    tipoRemetente: 'Motorista',
    telefone: '(19) 98111-4455',
    emitente: 'Plásticos Sumaré Ltda',
    cnpj: '45678901000123',
    numero: '12045',
    serie: '1',
    chave: comDigitoErrado(chave('45678901000123', 12045, 1, '55120934')),
    leitura: 'IA (texto impresso)',
    confirmadaPor: null,
  },
  {
    id: 'n4',
    recebidaEm: '03/11/2026 08:31',
    remetente: 'Marcos Oliveira',
    tipoRemetente: 'Agregado',
    telefone: '(11) 97766-2200',
    emitente: 'Metalúrgica Campinas SA',
    cnpj: '23456789000101',
    numero: '99102',
    serie: '2',
    chave: chave('23456789000101', 99102, 2, '90817263'),
    leitura: 'Código de barras',
    confirmadaPor: null,
  },
  {
    id: 'n5',
    recebidaEm: '03/11/2026 08:05',
    remetente: 'Paulo Henrique',
    tipoRemetente: 'Agregado',
    telefone: '(19) 99222-3344',
    emitente: 'Farmacêutica BioLife Ltda',
    cnpj: '56789012000134',
    // Número lido diverge do que está na chave (foto com reflexo no campo Nº)
    numero: '33007',
    serie: '1',
    chave: chave('56789012000134', 33001, 1, '11029384'),
    leitura: 'Código de barras',
    confirmadaPor: null,
  },
  {
    id: 'n6',
    recebidaEm: '02/11/2026 17:48',
    remetente: 'José da Silva',
    tipoRemetente: 'Motorista',
    telefone: '(19) 98877-1100',
    emitente: 'Têxtil Americana Ind. e Com. Ltda',
    cnpj: '67890123000145',
    numero: '5530',
    serie: '3',
    chave: chave('67890123000145', 5530, 3, '73645512'),
    leitura: 'Código de barras',
    confirmadaPor: null,
  },
  {
    id: 'n7',
    recebidaEm: '02/11/2026 16:20',
    remetente: 'Marcos Oliveira',
    tipoRemetente: 'Agregado',
    telefone: '(11) 97766-2200',
    emitente: 'Frigorífico Norte Sul SA',
    cnpj: '78901234000156',
    numero: '88120',
    serie: '1',
    // Foto cortada: faltaram os últimos dígitos da chave
    chave: chave('78901234000156', 88120, 1, '20391847').slice(0, 38),
    leitura: 'IA (texto impresso)',
    confirmadaPor: null,
  },
  {
    id: 'n8',
    recebidaEm: '02/11/2026 14:02',
    remetente: 'Ricardo Ferreira',
    tipoRemetente: 'Motorista',
    telefone: '(19) 98111-4455',
    emitente: 'Cerâmica Paulínia Ltda',
    cnpj: '89012345000167',
    numero: '2210',
    serie: '1',
    chave: chave('89012345000167', 2210, 1, '66475839'),
    leitura: 'IA (texto impresso)',
    confirmadaPor: 'Ana Paula Souza',
  },
];
