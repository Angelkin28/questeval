import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEvaluacionByProyecto } from '../hooks/useEvaluacionByProyecto'

export default function ProjectDetailScreen() {
  const { proyectoId } = useParams<{ proyectoId: string }>()
  const navigate = useNavigate()
  const { data: evaluacion, isLoading, error } = useEvaluacionByProyecto(proyectoId ?? '')

  if (!proyectoId) {
    return <div style={{ padding: 24 }}>Proyecto no encontrado.</div>
  }
  if (isLoading && evaluacion === undefined) {
    return <div style={{ padding: 24 }}>Cargando…</div>
  }
  if (error) {
    return <div style={{ padding: 24, color: 'var(--qe-error)' }}>Error al cargar evaluación.</div>
  }

  const tieneEvaluacion = evaluacion != null

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 16,
          padding: '8px 16px',
          background: 'transparent',
          border: '1px solid var(--qe-outline)',
          borderRadius: 8,
          cursor: 'pointer',
          color: 'var(--qe-on-surface)',
        }}
      >
        Volver
      </button>
      {tieneEvaluacion ? (
        <div>
          <p style={{ color: 'var(--qe-on-surface)' }}>Hay una evaluación disponible.</p>
          <Link
            to={`/app/proyectos/${proyectoId}/evaluacion`}
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '12px 24px',
              borderRadius: 12,
              background: 'var(--qe-primary)',
              color: 'var(--qe-on-primary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ver evaluación
          </Link>
        </div>
      ) : (
        <p style={{ color: 'var(--qe-on-surface-variant)' }}>Evaluación no disponible.</p>
      )}
    </div>
  )
}
