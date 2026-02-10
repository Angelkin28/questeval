import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp, isAlumno } from './context/AppContext'
import Login from './screens/Login'
import MainShell from './screens/MainShell'
import AppGuard from './screens/AppGuard'
import HomeTab from './screens/HomeTab'
import ProjectsTab from './screens/ProjectsTab'
import AnalysisTab from './screens/AnalysisTab'
import ProfileTab from './screens/ProfileTab'

const ProjectDetailScreen = lazy(() => import('./screens/ProjectDetailScreen'))
const EvaluationScreen = lazy(() => import('./screens/EvaluationScreen'))

function RootRedirect() {
  const { user, loading } = useApp()
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <span>Cargando…</span>
      </div>
    )
  }
  if (user != null && isAlumno(user)) return <Navigate to="/app" replace />
  if (user != null) return <Navigate to="/app" replace />
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user, loading } = useApp()
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <span>Cargando…</span>
      </div>
    )
  }
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Navigate to="/app" replace />} />
      <Route path="/app" element={<AppGuard />}>
        <Route element={<MainShell />}>
          <Route index element={<HomeTab />} />
          <Route path="proyectos" element={<ProjectsTab />} />
          <Route path="proyectos/:proyectoId" element={<Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}><ProjectDetailScreen /></Suspense>} />
          <Route path="proyectos/:proyectoId/evaluacion" element={<Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}><EvaluationScreen /></Suspense>} />
          <Route path="analisis" element={<AnalysisTab />} />
          <Route path="perfil" element={<ProfileTab />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
