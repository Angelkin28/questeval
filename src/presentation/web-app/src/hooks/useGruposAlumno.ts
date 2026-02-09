import useSWR from 'swr'
import { getGruposDelAlumno } from '../lib/fetchers'
import type { Grupo } from '../types/db'

export function useGruposAlumno(usuarioId: string) {
  return useSWR<Grupo[]>(
    usuarioId ? ['grupos', usuarioId] : null,
    () => getGruposDelAlumno(usuarioId)
  )
}
