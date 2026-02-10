import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '12px 8px',
  background: 'var(--qe-surface)',
  borderTop: '1px solid var(--qe-outline)',
  gap: 8,
}

const linkStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 12px',
  background: 'none',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  textDecoration: 'none',
  color: active ? 'var(--qe-primary)' : 'var(--qe-on-surface-variant)',
  fontWeight: active ? 600 : 400,
  fontSize: 12,
})

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 24px',
  background: 'var(--qe-surface)',
  borderBottom: '1px solid var(--qe-outline)',
}

export default function MainShell() {
  const { selectedGroup } = useApp()
  const location = useLocation()
  const path = location.pathname

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/questeval.jpeg" alt="QuestEval" style={{ height: 32, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedGroup?.nombre ?? 'QuestEval'}</div>
            {selectedGroup ? (
              <div style={{ fontSize: 12, color: 'var(--qe-on-surface-variant)' }}>Grupo seleccionado</div>
            ) : null}
          </div>
        </div>
        <span style={{ color: 'var(--qe-on-surface-variant)', fontSize: 20 }} aria-hidden>🔔</span>
      </header>

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>

      <nav style={navStyle}>
        <NavLink
          to="/app"
          end
          style={({ isActive }) => linkStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>🏠</span>
          INICIO
        </NavLink>
        <NavLink
          to="/app/proyectos"
          style={({ isActive }) => linkStyle(isActive || path.startsWith('/app/proyectos'))}
        >
          <span style={{ fontSize: 18 }}>📁</span>
          PROYECTOS
        </NavLink>
        <NavLink
          to="/app/analisis"
          style={({ isActive }) => linkStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>📊</span>
          ANÁLISIS
        </NavLink>
        <NavLink
          to="/app/perfil"
          style={({ isActive }) => linkStyle(isActive)}
        >
          <span style={{ fontSize: 18 }}>👤</span>
          PERFIL
        </NavLink>
      </nav>
    </div>
  )
}
