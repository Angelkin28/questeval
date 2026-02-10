import useSWR from 'swr'
import { getEvaluacionPorProyecto } from '../lib/fetchers'
import type { Evaluacion } from '../types/db'

export function useEvaluacionByProyecto(proyectoId: string) {
  return useSWR<Evaluacion | null>(
    proyectoId ? ['evaluacion', proyectoId] : null,
    () => getEvaluacionPorProyecto(proyectoId)
  )
}
