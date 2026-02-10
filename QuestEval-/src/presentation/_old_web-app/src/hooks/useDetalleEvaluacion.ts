import useSWR from 'swr'
import { getDetalleEvaluacionConCriterios } from '../lib/fetchers'
import type { DetalleEvaluacion } from '../types/db'

export function useDetalleEvaluacion(evaluacionId: string) {
  return useSWR<DetalleEvaluacion[]>(
    evaluacionId ? ['detalle-evaluacion', evaluacionId] : null,
    () => getDetalleEvaluacionConCriterios(evaluacionId)
  )
}
