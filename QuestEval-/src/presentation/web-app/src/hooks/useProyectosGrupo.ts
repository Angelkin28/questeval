import useSWR from 'swr'
import { getProyectosDelGrupo } from '../lib/fetchers'
import type { Proyecto } from '../types/db'

export function useProyectosGrupo(grupoId: string | null) {
  return useSWR<Proyecto[]>(
    grupoId ? ['proyectos', grupoId] : null,
    () => getProyectosDelGrupo(grupoId!)
  )
}
