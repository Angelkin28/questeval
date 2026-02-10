import { useApp } from '../context/AppContext'

export default function AccessDenied() {
  const { signOut } = useApp()
  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: 'var(--qe-on-surface)' }}>Acceso solo para alumnos. Si tienes otro rol, usa la aplicación correspondiente.</p>
      <button
        type="button"
        onClick={() => signOut()}
        style={{
          marginTop: 16,
          padding: '12px 24px',
          borderRadius: 12,
          border: 'none',
          background: 'var(--qe-primary)',
          color: 'var(--qe-on-primary)',
          cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
