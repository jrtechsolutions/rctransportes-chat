import { useState } from 'react';
import { AGENTES_POR_SETOR } from '../mock/data';
import type { Pendencia } from '../mock/types';
import { Modal } from './Modal';

export const RESPONSAVEIS = Object.values(AGENTES_POR_SETOR)
  .flat()
  .map((a) => a.nome);

type Prioridade = Pendencia['prioridade'];

export type NovaPendenciaDados = {
  origemTipo: Pendencia['origemTipo'];
  origemRef: string | null;
  descricao: string;
  responsavel: string;
  prazo: string;
  prioridade: Prioridade;
};

function formatarPrazo(valor: string): string {
  if (!valor) return '';
  const [data, hora] = valor.split('T');
  const [a, m, d] = data.split('-');
  return `${d}/${m}/${a} ${hora ?? '18:00'}`;
}

/** Modal de criação de pendência — origem opcional; vem travada quando aberto de dentro de uma ocorrência */
export function NovaPendenciaModal({
  origemFixa,
  onClose,
  onCriar,
}: {
  origemFixa?: { tipo: 'Ocorrência' | 'Atendimento'; ref: string };
  onClose: () => void;
  onCriar: (dados: NovaPendenciaDados) => void;
}) {
  const [origemTipo, setOrigemTipo] = useState<string>(origemFixa?.tipo ?? '');
  const [origemRef, setOrigemRef] = useState(origemFixa?.ref ?? '');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState(RESPONSAVEIS[0]);
  const [prazo, setPrazo] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('Media');

  const valido = descricao.trim() && responsavel && prazo;

  const criar = () => {
    if (!valido) return;
    onCriar({
      origemTipo: (origemTipo || null) as Pendencia['origemTipo'],
      origemRef: origemTipo ? origemRef.trim() || null : null,
      descricao: descricao.trim(),
      responsavel,
      prazo: formatarPrazo(prazo),
      prioridade,
    });
  };

  return (
    <Modal title="Nova pendência" onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Origem (opcional)</label>
          <select
            value={origemTipo}
            disabled={!!origemFixa}
            onChange={(e) => setOrigemTipo(e.target.value)}
          >
            <option value="">Sem vínculo</option>
            <option value="Ocorrência">Ocorrência</option>
            <option value="Atendimento">Atendimento</option>
          </select>
        </div>
        <div className="field">
          <label>{origemTipo === 'Atendimento' ? 'Contato do atendimento' : 'Protocolo da ocorrência'}</label>
          <input
            value={origemRef}
            disabled={!origemTipo || !!origemFixa}
            onChange={(e) => setOrigemRef(e.target.value)}
            placeholder={origemTipo === 'Atendimento' ? 'Ex.: Distribuidora ABC Ltda' : 'Ex.: OC-2026-0142'}
          />
        </div>
      </div>
      <div className="field">
        <label>Descrição *</label>
        <textarea
          rows={3}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: Retornar ao cliente com a nova previsão de entrega"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Responsável *</label>
          <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
            {RESPONSAVEIS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Prazo *</label>
          <input type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
        <div className="field">
          <label>Prioridade *</label>
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
            <option value="Critica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Media">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-ambar"
        style={{ width: '100%' }}
        disabled={!valido}
        onClick={criar}
      >
        Criar pendência
      </button>
    </Modal>
  );
}

/** Modais mockados de "Alterar responsável" e "Definir/alterar prazo" — só visuais */
export function AjustePendenciaModal({
  tipo,
  pendencia,
  onClose,
}: {
  tipo: 'responsavel' | 'prazo';
  pendencia: Pendencia;
  onClose: () => void;
}) {
  return (
    <Modal
      title={tipo === 'responsavel' ? 'Alterar responsável' : 'Definir/alterar prazo'}
      onClose={onClose}
    >
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--mono)' }}>
        <span className="mono">{pendencia.protocolo}</span> · {pendencia.descricao}
      </p>
      {tipo === 'responsavel' ? (
        <div className="field">
          <label>Novo responsável</label>
          <select defaultValue={pendencia.responsavel}>
            {RESPONSAVEIS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="field">
          <label>Novo prazo</label>
          <input type="datetime-local" />
          <span className="hint">Prazo atual: {pendencia.prazo}</span>
        </div>
      )}
      <div className="field">
        <label>Justificativa (opcional)</label>
        <textarea rows={2} placeholder="Fica registrada no log de auditoria" />
      </div>
      <button type="button" className="btn btn-ambar" style={{ width: '100%' }} onClick={onClose}>
        Salvar (mock)
      </button>
    </Modal>
  );
}
