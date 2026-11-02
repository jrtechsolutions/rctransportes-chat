import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logoBranco from '../assets/rc-logo-branco.png';
import { initials } from '../lib/sanitize';
import { NAV_GROUPS, TELA_LABEL, TELA_ROTA } from '../mock/data';
import { usePrototype } from '../mock/PrototypeContext';
import type { TelaId } from '../mock/types';
import { AdvancedSearch } from './AdvancedSearch';
import { IconChevron, IconLogout, IconTv, NavIcon } from './NavIcons';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { usuario, setUsuarioId, logout, hasTela, homePath, usuariosSeletor } = usePrototype();
  const navigate = useNavigate();
  const location = useLocation();

  const groups = NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.telas
      .filter((t) => hasTela(t))
      .map((t) => ({ to: TELA_ROTA[t], label: TELA_LABEL[t], tela: t })),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    const rotaParaTela = (Object.entries(TELA_ROTA) as [TelaId, string][]).find(
      ([, path]) => location.pathname === path || location.pathname.startsWith(path + '/'),
    );
    if (rotaParaTela && !hasTela(rotaParaTela[0])) {
      navigate(homePath, { replace: true });
    }
  }, [usuario.id, location.pathname, hasTela, homePath, navigate]);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <div className={styles.brand}>
            <img
              src={logoBranco}
              alt="RC Transportes"
              className={styles.logo}
              width={48}
              height={48}
            />
            <div className={styles.brandMeta}>
              <span className={styles.brandName}>RC Transportes</span>
              <span className={styles.brandSub}>Gestão de atendimentos</span>
            </div>
          </div>

          <div className={styles.perfilBox}>
            <label className={styles.perfilLabel} htmlFor="user-view">
              Visualizar como
            </label>
            <div className={styles.selectWrap}>
              <select
                id="user-view"
                className={styles.perfilSelect}
                value={usuario.id}
                onChange={(e) => setUsuarioId(e.target.value)}
              >
                {usuariosSeletor.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.labelSeletor ?? u.nome}
                  </option>
                ))}
              </select>
              <IconChevron className={styles.selectChevron} />
            </div>
          </div>

          <nav className={styles.nav}>
            {groups.map((group) => (
              <div key={group.label} className={styles.navGroup}>
                <div className={styles.navLabel}>{group.label}</div>
                <div className={styles.navItems}>
                  {group.items.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                      }
                    >
                      <span className={styles.navIcon}>
                        <NavIcon tela={link.tela} />
                      </span>
                      <span className={styles.navText}>{link.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className={styles.navFooter}>
            <a href="/painel-tv" target="_blank" rel="noopener" className={styles.tvLink}>
              <IconTv />
              <span>Painel da TV</span>
              <span className={styles.tvExt}>↗</span>
            </a>

            <div className={styles.userCard}>
              <div className={styles.avatar} aria-hidden>
                {initials(usuario.nome)}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{usuario.nome.split(' ')[0]}</div>
                <div className={styles.userRole}>
                  {usuario.admin ? 'Administrador' : usuario.setor}
                </div>
              </div>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={onLogout}
                title="Sair"
                aria-label="Sair"
              >
                <IconLogout />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <AdvancedSearch />
          <div className={styles.topbarHint}>Dados fictícios · apresentação RC Transportes</div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
