import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PrototypeProvider, usePrototype } from './mock/PrototypeContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { AtendimentoPage } from './pages/AtendimentoPage';
import { ConfigSetorPage } from './pages/ConfigSetorPage';
import { OcorrenciasPage } from './pages/OcorrenciasPage';
import { KmPage } from './pages/KmPage';
import { AbrirChamado } from './pages/AbrirChamado';
import { TrabalharChamado } from './pages/TrabalharChamado';
import { PainelTV } from './pages/PainelTV';
import { DashboardPage } from './pages/DashboardPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { PendenciasPage } from './pages/PendenciasPage';
import { NumerosWhatsappPage } from './pages/NumerosWhatsappPage';
import { FalhasIntegracaoPage } from './pages/FalhasIntegracaoPage';
import { AuditoriaPage } from './pages/AuditoriaPage';
import type { TelaId } from './mock/types';
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { loggedIn } = usePrototype();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { loggedIn, homePath } = usePrototype();
  if (loggedIn) return <Navigate to={homePath} replace />;
  return children;
}

function GuardTela({ tela, children }: { tela: TelaId; children: ReactNode }) {
  const { hasTela, homePath } = usePrototype();
  if (!hasTela(tela)) return <Navigate to={homePath} replace />;
  return children;
}

function DefaultRedirect() {
  const { loggedIn, homePath } = usePrototype();
  const location = useLocation();
  if (!loggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Navigate to={homePath} replace />;
}

export function App() {
  return (
    <PrototypeProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />

        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route
            path="/atendimento"
            element={
              <GuardTela tela="conversas">
                <AtendimentoPage />
              </GuardTela>
            }
          />
          <Route
            path="/config-setor"
            element={
              <GuardTela tela="config-setor">
                <ConfigSetorPage />
              </GuardTela>
            }
          />
          <Route
            path="/ocorrencias"
            element={
              <GuardTela tela="ocorrencias">
                <OcorrenciasPage />
              </GuardTela>
            }
          />
          <Route
            path="/pendencias"
            element={
              <GuardTela tela="pendencias">
                <PendenciasPage />
              </GuardTela>
            }
          />
          <Route
            path="/km"
            element={
              <GuardTela tela="km">
                <KmPage />
              </GuardTela>
            }
          />
          <Route path="/chamados" element={<Navigate to="/chamados/abrir" replace />} />
          <Route
            path="/chamados/abrir"
            element={
              <GuardTela tela="abrir-chamado">
                <AbrirChamado />
              </GuardTela>
            }
          />
          <Route
            path="/chamados/trabalhar"
            element={
              <GuardTela tela="trabalhar-chamado">
                <TrabalharChamado />
              </GuardTela>
            }
          />
          <Route
            path="/dashboard"
            element={
              <GuardTela tela="dashboard">
                <DashboardPage />
              </GuardTela>
            }
          />
          <Route
            path="/relatorios"
            element={
              <GuardTela tela="relatorios">
                <RelatoriosPage />
              </GuardTela>
            }
          />
          <Route
            path="/usuarios"
            element={
              <GuardTela tela="usuarios">
                <UsuariosPage />
              </GuardTela>
            }
          />
          <Route
            path="/numeros-whatsapp"
            element={
              <GuardTela tela="numeros-whatsapp">
                <NumerosWhatsappPage />
              </GuardTela>
            }
          />
          <Route
            path="/falhas-integracao"
            element={
              <GuardTela tela="falhas-integracao">
                <FalhasIntegracaoPage />
              </GuardTela>
            }
          />
          <Route
            path="/auditoria"
            element={
              <GuardTela tela="auditoria">
                <AuditoriaPage />
              </GuardTela>
            }
          />
        </Route>

        {/* Painel de TV é público no protótipo — abre em nova aba sem precisar do login */}
        <Route path="/painel-tv" element={<PainelTV />} />

        <Route path="/" element={<DefaultRedirect />} />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </PrototypeProvider>
  );
}
