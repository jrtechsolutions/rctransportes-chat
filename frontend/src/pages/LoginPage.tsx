import { useNavigate } from 'react-router-dom';
import logoColorido from '../assets/rc-logo-colorido.png';
import { usePrototype } from '../mock/PrototypeContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login, setUsuarioId } = usePrototype();
  const navigate = useNavigate();

  const entrar = () => {
    setUsuarioId('u-carlos');
    login();
    navigate('/atendimento', { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <img src={logoColorido} alt="RC Transportes" className={styles.logo} />
        <h1>Sistema de Gestão de Atendimentos</h1>
        <p className={styles.sub}>
          Acesso exclusivo para funcionários do escritório. Use sua conta Microsoft corporativa.
        </p>
        <button type="button" className="btn btn-primary" onClick={entrar}>
          Entrar com Microsoft
        </button>
      </div>
    </div>
  );
}
