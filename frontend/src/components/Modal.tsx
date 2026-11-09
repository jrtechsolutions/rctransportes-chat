import type { ReactNode } from 'react';
import styles from './Modal.module.css';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** Para telas com imagem + formulário lado a lado */
  extraWide?: boolean;
};

export function Modal({ title, onClose, children, wide, extraWide }: Props) {
  const sizeClass = extraWide ? styles.extraWide : wide ? styles.wide : '';
  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={`${styles.modal} ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
