import { useParams, useNavigate } from 'react-router-dom'
import { useEvaluacionByProyecto } from '../hooks/useEvaluacionByProyecto'
import { useDetalleEvaluacion } from '../hooks/useDetalleEvaluacion'
import { useRetroalimentacionPublica } from '../hooks/useRetroalimentacionPublica'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

export default function EvaluationScreen() {
  const { proyectoId } = useParams<{ proyectoId: string }>()
  const navigate = useNavigate()
  const { data: evaluacion, isLoading: loadingEval, error: errorEval } = useEvaluacionByProyecto(proyectoId ?? '')
  const evaluacionId = evaluacion?.id ?? ''
  const { data: detalle, isLoading: loadingDetalle } = useDetalleEvaluacion(evaluacionId)
  const { data: retro, isLoading: loadingRetro } = useRetroalimentacionPublica(evaluacionId)

  if (!proyectoId) {
    return <div style={{ padding: 24 }}>Proyecto no encontrado.</div>
  }
  if (loadingEval && evaluacion == null) {
    return <div style={{ padding: 24 }}>Cargando evaluación…</div>
  }
  if (errorEval || evaluacion == null) {
    return <div style={{ padding: 24, color: 'var(--qe-error)' }}>No se pudo cargar la evaluación.</div>
  }

  const loading = loadingDetalle || loadingRetro
  const detalles = detalle ?? []
  const retroList = retro ?? []

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
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

      <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Evaluación</h2>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--qe-on-surface-variant)' }}>
        {formatDate(evaluacion.fecha_evaluacion)}
      </p>
      <p style={{ margin: '16px 0', fontSize: 24, fontWeight: 600, color: 'var(--qe-on-surface)' }}>
        Calificación: {evaluacion.calificacion_final != null ? Number(evaluacion.calificacion_final) : 0}/100
      </p>

      <h3 style={{ margin: '24px 0 12px', fontSize: 16 }}>Competencias alcanzadas</h3>
      {loading ? (
        <p style={{ color: 'var(--qe-on-surface-variant)' }}>Cargando desglose…</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {detalles.map((d) => {
            const crit = d.criterios
            const max = crit?.puntuacion_maxima ?? 0
            const obt = d.puntuacion_obtenida ?? 0
            return (
              <li key={d.id} style={{ marginBottom: 8 }}>
                {crit?.nombre ?? 'Criterio'}: {obt}/{max}
              </li>
            )
          })}
        </ul>
      )}

      {retroList.length > 0 ? (
        <>
          <h3 style={{ margin: '24px 0 12px', fontSize: 16 }}>Retroalimentación</h3>
          <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'none' }}>
            {retroList.map((r) => (
              <li key={r.id} style={{ marginBottom: 12, padding: 12, background: 'var(--qe-surface)', borderRadius: 8 }}>
                {r.comentario}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
