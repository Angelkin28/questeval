import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useProyectosGrupo } from '../hooks/useProyectosGrupo'

const cardStyle: React.CSSProperties = {
  display: 'block',
  padding: 16,
  borderRadius: 12,
  background: 'var(--qe-surface)',
  border: '1px solid var(--qe-outline)',
  textAlign: 'left',
  textDecoration: 'none',
  color: 'var(--qe-on-surface)',
}

export default function ProjectsTab() {
  const { selectedGroupId, selectedGroup } = useApp()
  const { data: proyectos, isLoading, error } = useProyectosGrupo(selectedGroupId)

  if (selectedGroupId == null) {
    return (
      <div style={{ padding: 24, color: 'var(--qe-on-surface-variant)' }}>
        Selecciona un grupo en Inicio para ver sus proyectos.
      </div>
    )
  }
  if (isLoading && proyectos == null) {
    return <div style={{ padding: 24 }}>Cargando proyectos…</div>
  }
  if (error) {
    return <div style={{ padding: 24, color: 'var(--qe-error)' }}>Error al cargar proyectos.</div>
  }
  if (proyectos == null || proyectos.length === 0) {
    return <div style={{ padding: 24, color: 'var(--qe-on-surface-variant)' }}>No hay proyectos en este grupo.</div>
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selectedGroup ? (
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{selectedGroup.nombre}</h2>
      ) : null}
      {proyectos.map((p) => (
        <Link key={p.id} to={`/app/proyectos/${p.id}`} style={cardStyle}>
          <strong>{p.nombre}</strong>
          <span style={{ color: 'var(--qe-on-surface-variant)', marginLeft: 8 }}>{p.estado}</span>
        </Link>
      ))}
    </div>
  )
}
