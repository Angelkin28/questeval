import { useApp } from '../context/AppContext'
import { useGruposAlumno } from '../hooks/useGruposAlumno'

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: 'var(--qe-surface)',
  border: '1px solid var(--qe-outline)',
  cursor: 'pointer',
  textAlign: 'left' as const,
}

export default function HomeTab() {
  const { user, setSelectedGroupId, setSelectedGroup } = useApp()
  const { data: grupos, isLoading, error } = useGruposAlumno(user?.id ?? '')

  if (isLoading && grupos == null) {
    return <div style={{ padding: 24 }}>Cargando grupos…</div>
  }
  if (error) {
    return <div style={{ padding: 24, color: 'var(--qe-error)' }}>Error al cargar grupos.</div>
  }
  if (grupos == null || grupos.length === 0) {
    return <div style={{ padding: 24, color: 'var(--qe-on-surface-variant)' }}>No perteneces a ningún grupo.</div>
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Selecciona un grupo</h2>
      {grupos.map((g) => (
        <button
          key={g.id}
          type="button"
          style={cardStyle}
          onClick={() => {
            setSelectedGroupId(g.id)
            setSelectedGroup(g)
          }}
        >
          <strong>{g.nombre}</strong>
          {g.codigo_acceso ? ` · ${g.codigo_acceso}` : null}
        </button>
      ))}
    </div>
  )
}
