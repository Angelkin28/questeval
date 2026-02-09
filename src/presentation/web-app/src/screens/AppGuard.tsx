import { Outlet } from 'react-router-dom'
import { useApp, isAlumno } from '../context/AppContext'
import AccessDenied from './AccessDenied'

export default function AppGuard() {
  const { user, loading } = useApp()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <span>Cargando…</span>
      </div>
    )
  }
  if (user != null && !isAlumno(user)) {
    return <AccessDenied />
  }
  return <Outlet />
}
