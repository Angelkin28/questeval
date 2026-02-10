import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProfileTab() {
  const { user, signOut } = useApp()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Perfil</h2>
      <p style={{ margin: 0, color: 'var(--qe-on-surface)' }}>
        {user?.nombre_completo ?? user?.email ?? 'Usuario'}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--qe-on-surface-variant)' }}>
        {user?.email ?? ''}
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        style={{
          marginTop: 24,
          padding: '12px 24px',
          borderRadius: 12,
          border: 'none',
          background: 'var(--qe-primary)',
          color: 'var(--qe-on-primary)',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
