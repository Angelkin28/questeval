import useSWR from 'swr'
import { getRetroalimentacionPublica } from '../lib/fetchers'
import type { Retroalimentacion } from '../types/db'

export function useRetroalimentacionPublica(evaluacionId: string) {
  return useSWR<Retroalimentacion[]>(
    evaluacionId ? ['retroalimentacion', evaluacionId] : null,
    () => getRetroalimentacionPublica(evaluacionId)
  )
}
