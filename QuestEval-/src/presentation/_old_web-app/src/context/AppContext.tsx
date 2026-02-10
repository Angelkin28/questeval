import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUsuarioWithRol } from '../lib/fetchers'
import type { UsuarioConRol } from '../types/db'
import type { Grupo } from '../types/db'

interface AppState {
  user: UsuarioConRol | null
  loading: boolean
  selectedGroupId: string | null
  selectedGroup: Grupo | null
  setSelectedGroupId: (id: string | null) => void
  setSelectedGroup: (g: Grupo | null) => void
  signOut: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (ctx == null) throw new Error('useApp must be used within AppProvider')
  return ctx
}

function isAlumno(user: UsuarioConRol | null): boolean {
  const nombre = user?.roles != null && typeof user.roles === 'object' && 'nombre' in user.roles
    ? (user.roles as { nombre?: string }).nombre
    : undefined
  return nombre === 'Alumno'
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsuarioConRol | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Grupo | null>(null)

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSelectedGroupId(null)
    setSelectedGroup(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const u = await getUsuarioWithRol(session.user.id)
        if (!cancelled) setUser(u ?? null)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (cancelled) return
      if (!session) {
        setUser(null)
        setSelectedGroupId(null)
        setSelectedGroup(null)
        return
      }
      try {
        const u = await getUsuarioWithRol(session.user.id)
        if (!cancelled) setUser(u ?? null)
      } catch {
        if (!cancelled) setUser(null)
      }
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const value: AppState = {
    user,
    loading,
    selectedGroupId,
    selectedGroup,
    setSelectedGroupId,
    setSelectedGroup,
    signOut,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export { isAlumno }
